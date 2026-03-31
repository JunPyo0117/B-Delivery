"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";

export interface KpiData {
  dau: number;
  newUsers: number;
  newOrders: number;
  completedDeliveries: number;
  pendingReports: number;
  activeRiders: number;
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

export interface DailyStat {
  date: string;
  orderCount: number;
  revenue: number;
}

export interface DashboardData {
  kpi: KpiData;
  dailyStats: DailyStat[];
  regionStats: RegionStat[];
  recentOrders: RecentOrder[];
  recentReports: RecentReport[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }

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
    activeRiders,
    recentOrdersRaw,
    recentReportsRaw,
    regionStatsRaw,
    dailyStatsRaw,
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

    // 활성 기사 (온라인)
    prisma.riderLocation.count({
      where: { isOnline: true },
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

    // 일별 주문/매출 통계 (최근 7일)
    prisma.$queryRaw<{ date: Date; order_count: bigint; revenue: number }[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS date,
        COUNT(*)::bigint AS order_count,
        COALESCE(SUM("totalPrice"), 0)::float AS revenue
      FROM "Order"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY date ASC
    `,
  ]);

  // 일별 통계 가공 (7일 전체 채우기 — 데이터 없는 날도 0으로 표시)
  const dailyStatsMap = new Map<string, { orderCount: number; revenue: number }>();
  for (const row of dailyStatsRaw) {
    const dateStr = new Date(row.date).toISOString().split("T")[0];
    dailyStatsMap.set(dateStr, {
      orderCount: Number(row.order_count),
      revenue: row.revenue,
    });
  }

  const dailyStats: DailyStat[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const stat = dailyStatsMap.get(dateStr);
    dailyStats.push({
      date: dateStr,
      orderCount: stat?.orderCount ?? 0,
      revenue: stat?.revenue ?? 0,
    });
  }

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
      activeRiders,
    },
    dailyStats,
    regionStats,
    recentOrders,
    recentReports,
  };
}
