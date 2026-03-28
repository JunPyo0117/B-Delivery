"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";

// ── 타입 ────────────────────────────────────────────────

export interface DailySalesData {
  date: string; // ISO date string (YYYY-MM-DD)
  totalSales: number;
  orderCount: number;
  avgPrice: number;
  deliveryFeeIncome: number;
}

export interface MenuRankingData {
  menuId: string;
  menuName: string;
  quantity: number;
  revenue: number;
  percentage: number; // 기여도 (%)
}

// ── 매출 통계 조회 ──────────────────────────────────────

export async function getSalesStats(
  restaurantId: string,
  startDate: string,
  endDate: string
): Promise<{ data: DailySalesData[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: [], error: "로그인이 필요합니다." };
  }

  // 소유권 확인
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerId: true },
  });

  if (!restaurant || restaurant.ownerId !== session.user.id) {
    return { data: [], error: "권한이 없습니다." };
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // DONE 상태의 주문만 조회
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: "DONE",
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      totalPrice: true,
      deliveryFee: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // JS에서 날짜별 그룹핑
  const dailyMap = new Map<
    string,
    { totalSales: number; orderCount: number; deliveryFeeIncome: number }
  >();

  // 기간 내 모든 날짜를 미리 채움 (주문이 없는 날도 0으로 표시)
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateKey = formatDateKey(currentDate);
    dailyMap.set(dateKey, {
      totalSales: 0,
      orderCount: 0,
      deliveryFeeIncome: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  for (const order of orders) {
    const dateKey = formatDateKey(order.createdAt);
    const existing = dailyMap.get(dateKey);

    if (existing) {
      existing.totalSales += order.totalPrice;
      existing.orderCount += 1;
      existing.deliveryFeeIncome += order.deliveryFee;
    } else {
      dailyMap.set(dateKey, {
        totalSales: order.totalPrice,
        orderCount: 1,
        deliveryFeeIncome: order.deliveryFee,
      });
    }
  }

  const data: DailySalesData[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date,
      totalSales: stats.totalSales,
      orderCount: stats.orderCount,
      avgPrice:
        stats.orderCount > 0
          ? Math.round(stats.totalSales / stats.orderCount)
          : 0,
      deliveryFeeIncome: stats.deliveryFeeIncome,
    }));

  return { data };
}

// ── 메뉴별 매출 순위 조회 ──────────────────────────────

export async function getMenuRanking(
  restaurantId: string,
  startDate: string,
  endDate: string
): Promise<{ data: MenuRankingData[]; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: [], error: "로그인이 필요합니다." };
  }

  // 소유권 확인
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerId: true },
  });

  if (!restaurant || restaurant.ownerId !== session.user.id) {
    return { data: [], error: "권한이 없습니다." };
  }

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // DONE 주문의 주문 항목을 메뉴별로 집계
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        restaurantId,
        status: "DONE",
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    },
    select: {
      menuId: true,
      quantity: true,
      price: true,
      optionPrice: true,
      menu: {
        select: { name: true },
      },
    },
  });

  // 메뉴별 집계
  const menuMap = new Map<
    string,
    { menuName: string; quantity: number; revenue: number }
  >();

  for (const item of orderItems) {
    const existing = menuMap.get(item.menuId);
    const itemRevenue = (item.price + item.optionPrice) * item.quantity;

    if (existing) {
      existing.quantity += item.quantity;
      existing.revenue += itemRevenue;
    } else {
      menuMap.set(item.menuId, {
        menuName: item.menu.name,
        quantity: item.quantity,
        revenue: itemRevenue,
      });
    }
  }

  // 매출 내림차순 정렬
  const sorted = Array.from(menuMap.entries())
    .map(([menuId, stats]) => ({
      menuId,
      ...stats,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 기여도 계산
  const totalRevenue = sorted.reduce((sum, item) => sum + item.revenue, 0);

  const data: MenuRankingData[] = sorted.map((item) => ({
    menuId: item.menuId,
    menuName: item.menuName,
    quantity: item.quantity,
    revenue: item.revenue,
    percentage:
      totalRevenue > 0
        ? Math.round((item.revenue / totalRevenue) * 100)
        : 0,
  }));

  return { data };
}

// ── 유틸 ────────────────────────────────────────────────

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
