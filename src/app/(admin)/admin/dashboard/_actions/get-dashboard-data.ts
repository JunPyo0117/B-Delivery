"use server";

import { prisma } from "@/lib/prisma";

export interface KpiData {
  dau: number;
  newUsers: number;
  newOrders: number;
  completedDeliveries: number;
  pendingReports: number;
}

export interface RegionStat {
  address: string;
  orderCount: number;
  totalRevenue: number;
}

export interface RecentOrder {
  id: string;
  userName: string;
  restaurantName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface RecentReport {
  id: string;
  reporterName: string;
  targetType: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface DashboardData {
  kpi: KpiData;
  regionStats: RegionStat[];
  recentOrders: RecentOrder[];
  recentReports: RecentReport[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // KPI 쿼리들을 병렬 실행
  const [
    dau,
    newUsers,
    newOrders,
    completedDeliveries,
    pendingReports,
    recentOrdersRaw,
    recentReportsRaw,
    regionStatsRaw,
  ] = await Promise.all([
    // DAU: 오늘 주문한 고유 사용자 수
    prisma.order
      .findMany({
        where: { createdAt: { gte: todayStart } },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then((r) => r.length),

    // 오늘 신규 가입
    prisma.user.count({
      where: { createdAt: { gte: todayStart } },
    }),

    // 오늘 신규 주문
    prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }),

    // 오늘 완료 배달
    prisma.order.count({
      where: {
        status: "DONE",
        updatedAt: { gte: todayStart },
      },
    }),

    // 대기중 신고
    prisma.report.count({
      where: { status: "PENDING" },
    }),

    // 최근 주문 10건
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { nickname: true } },
        restaurant: { select: { name: true } },
      },
    }),

    // 최근 신고 10건
    prisma.report.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { nickname: true } },
      },
    }),

    // 지역별 주문 통계 (최근 7일) - deliveryAddress 기준 집계
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: {
        deliveryAddress: true,
        totalPrice: true,
      },
    }),
  ]);

  // 지역별 통계 집계 (deliveryAddress에서 시/구 추출)
  const regionMap = new Map<string, { count: number; revenue: number }>();
  for (const order of regionStatsRaw) {
    // "서울특별시 강남구 ..." → "서울특별시 강남구"
    const parts = order.deliveryAddress.split(" ");
    const region = parts.slice(0, 2).join(" ") || order.deliveryAddress;
    const existing = regionMap.get(region) || { count: 0, revenue: 0 };
    existing.count += 1;
    existing.revenue += order.totalPrice;
    regionMap.set(region, existing);
  }

  const regionStats: RegionStat[] = Array.from(regionMap.entries())
    .map(([address, data]) => ({
      address,
      orderCount: data.count,
      totalRevenue: data.revenue,
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10);

  const recentOrders: RecentOrder[] = recentOrdersRaw.map((order) => ({
    id: order.id,
    userName: order.user.nickname,
    restaurantName: order.restaurant.name,
    totalPrice: order.totalPrice,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  }));

  const recentReports: RecentReport[] = recentReportsRaw.map((report) => ({
    id: report.id,
    reporterName: report.reporter.nickname,
    targetType: report.targetType,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
  }));

  return {
    kpi: {
      dau,
      newUsers,
      newOrders,
      completedDeliveries,
      pendingReports,
    },
    regionStats,
    recentOrders,
    recentReports,
  };
}
