"use server";

import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/client";

// ── 타입 정의 ────────────────────────────────────────────

export interface DashboardOrderItem {
  id: string;
  menuName: string;
  quantity: number;
  price: number;
}

export interface DashboardOrder {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress: string;
  customerNickname: string;
  items: DashboardOrderItem[];
  createdAt: string;
  updatedAt: string;
  delivery: {
    riderId: string | null;
    status: string;
  } | null;
}

export interface DashboardStats {
  todaySales: number;
  todayOrderCount: number;
  avgOrderPrice: number;
  avgDeliveryTime: number; // 분 단위
  salesChange: number; // % 변화 (어제 대비)
  orderCountChange: number;
  avgPriceChange: number;
  deliveryTimeChange: number;
}

export interface HourlyOrderData {
  hour: number;
  count: number;
}

export interface PopularMenu {
  menuName: string;
  orderCount: number;
  revenue: number;
}

export interface DashboardReview {
  id: string;
  rating: number;
  content: string | null;
  ownerReply: string | null;
  createdAt: string;
  user: {
    nickname: string;
  };
  orderMenuNames: string[];
}

// ── 헬퍼 ──────────────────────────────────────────────────

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// ── 오늘의 주문 (칸반 보드용) ──────────────────────────────

export async function getDashboardOrders(
  restaurantId: string
): Promise<DashboardOrder[]> {
  const now = new Date();
  const startOfDay = getStartOfDay(now);
  const endOfDay = getEndOfDay(now);

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: {
        in: [
          "PENDING",
          "COOKING",
          "WAITING_RIDER",
          "RIDER_ASSIGNED",
          "PICKED_UP",
        ],
      },
    },
    include: {
      user: { select: { nickname: true } },
      items: {
        include: {
          menu: { select: { name: true } },
        },
      },
      delivery: {
        select: { riderId: true, status: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((order: any) => ({
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    deliveryAddress: order.deliveryAddress,
    customerNickname: order.user.nickname,
    items: order.items.map((item: any) => ({
      id: item.id,
      menuName: item.menu.name,
      quantity: item.quantity,
      price: item.price,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    delivery: order.delivery
      ? { riderId: order.delivery.riderId, status: order.delivery.status }
      : null,
  }));
}

// ── 오늘 매출 요약 (어제 대비 변화율 포함) ──────────────────

export async function getDashboardStats(
  restaurantId: string
): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = getStartOfDay(now);
  const todayEnd = getEndOfDay(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = getStartOfDay(yesterday);
  const yesterdayEnd = getEndOfDay(yesterday);

  // 오늘 / 어제 주문 (CANCELLED 제외)
  const [todayOrders, yesterdayOrders] = await Promise.all([
    prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { not: "CANCELLED" },
      },
      select: { totalPrice: true },
    }),
    prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
        status: { not: "CANCELLED" },
      },
      select: { totalPrice: true },
    }),
  ]);

  const todaySales = todayOrders.reduce((sum: number, o: any) => sum + o.totalPrice, 0);
  const todayCount = todayOrders.length;
  const todayAvg = todayCount > 0 ? Math.round(todaySales / todayCount) : 0;

  const yesterdaySales = yesterdayOrders.reduce(
    (sum: number, o: any) => sum + o.totalPrice,
    0
  );
  const yesterdayCount = yesterdayOrders.length;
  const yesterdayAvg =
    yesterdayCount > 0 ? Math.round(yesterdaySales / yesterdayCount) : 0;

  // 평균 배달 시간 (완료된 주문의 delivery completedAt - createdAt)
  const [todayDeliveries, yesterdayDeliveries] = await Promise.all([
    prisma.delivery.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: "DONE",
        },
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
    }),
    prisma.delivery.findMany({
      where: {
        order: {
          restaurantId,
          createdAt: { gte: yesterdayStart, lte: yesterdayEnd },
          status: "DONE",
        },
        completedAt: { not: null },
      },
      select: { createdAt: true, completedAt: true },
    }),
  ]);

  function avgMinutes(
    deliveries: { createdAt: Date; completedAt: Date | null }[]
  ): number {
    if (deliveries.length === 0) return 0;
    const totalMs = deliveries.reduce((sum, d) => {
      if (!d.completedAt) return sum;
      return sum + (d.completedAt.getTime() - d.createdAt.getTime());
    }, 0);
    return Math.round(totalMs / deliveries.length / 60000);
  }

  const todayAvgDelivery = avgMinutes(todayDeliveries);
  const yesterdayAvgDelivery = avgMinutes(yesterdayDeliveries);

  function percentChange(today: number, yesterday: number): number {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return Number(((today - yesterday) / yesterday * 100).toFixed(1));
  }

  return {
    todaySales,
    todayOrderCount: todayCount,
    avgOrderPrice: todayAvg,
    avgDeliveryTime: todayAvgDelivery,
    salesChange: percentChange(todaySales, yesterdaySales),
    orderCountChange: percentChange(todayCount, yesterdayCount),
    avgPriceChange: percentChange(todayAvg, yesterdayAvg),
    deliveryTimeChange: percentChange(todayAvgDelivery, yesterdayAvgDelivery),
  };
}

// ── 시간대별 주문 추이 ──────────────────────────────────────

export async function getHourlyOrders(
  restaurantId: string
): Promise<HourlyOrderData[]> {
  const now = new Date();
  const todayStart = getStartOfDay(now);
  const todayEnd = getEndOfDay(now);

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: { gte: todayStart, lte: todayEnd },
      status: { not: "CANCELLED" },
    },
    select: { createdAt: true },
  });

  // 0~23시 초기화
  const hourMap = new Map<number, number>();
  for (let h = 0; h < 24; h++) {
    hourMap.set(h, 0);
  }

  for (const order of orders) {
    const hour = order.createdAt.getHours();
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }

  return Array.from(hourMap.entries()).map(([hour, count]) => ({
    hour,
    count,
  }));
}

// ── 인기 메뉴 TOP 5 ────────────────────────────────────────

export async function getPopularMenus(
  restaurantId: string
): Promise<PopularMenu[]> {
  const now = new Date();
  const todayStart = getStartOfDay(now);
  const todayEnd = getEndOfDay(now);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        restaurantId,
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { not: "CANCELLED" },
      },
    },
    include: {
      menu: { select: { name: true } },
    },
  });

  // 메뉴별 집계
  const menuMap = new Map<
    string,
    { menuName: string; orderCount: number; revenue: number }
  >();

  for (const item of orderItems) {
    const existing = menuMap.get(item.menuId);
    const itemRevenue = (item.price + item.optionPrice) * item.quantity;
    if (existing) {
      existing.orderCount += item.quantity;
      existing.revenue += itemRevenue;
    } else {
      menuMap.set(item.menuId, {
        menuName: item.menu.name,
        orderCount: item.quantity,
        revenue: itemRevenue,
      });
    }
  }

  return Array.from(menuMap.values())
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 5);
}

// ── 최근 리뷰 (24시간 이내) ─────────────────────────────────

export async function getRecentReviews(
  restaurantId: string
): Promise<DashboardReview[]> {
  const since = new Date();
  since.setHours(since.getHours() - 24);

  const reviews = await prisma.review.findMany({
    where: {
      restaurantId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: { select: { nickname: true } },
      order: {
        include: {
          items: {
            include: {
              menu: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return reviews.map((r: any) => ({
    id: r.id,
    rating: r.rating,
    content: r.content,
    ownerReply: r.ownerReply,
    createdAt: r.createdAt.toISOString(),
    user: { nickname: r.user.nickname },
    orderMenuNames: r.order.items.map((item: any) => item.menu.name),
  }));
}
