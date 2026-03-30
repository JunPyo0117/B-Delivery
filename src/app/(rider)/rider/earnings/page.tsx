import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { DeliveryStatus } from "@/generated/prisma/client";

import { EarningsDashboard } from "./_components/earnings-dashboard";

/**
 * 수익 요약 페이지
 *
 * - 오늘/이번 주/이번 달 탭
 * - KPI: 총 수익, 배달 건수
 */
export default async function RiderEarningsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();

  // 오늘
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 이번 주 (일요일 시작)
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

  // 이번 달
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // 세 기간의 배달 통계를 한번에 조회
  const [todayDeliveries, weekDeliveries, monthDeliveries] = await Promise.all([
    prisma.delivery.findMany({
      where: {
        riderId: session.user.id,
        status: DeliveryStatus.DONE,
        completedAt: { gte: todayStart },
      },
      select: { riderFee: true },
    }),
    prisma.delivery.findMany({
      where: {
        riderId: session.user.id,
        status: DeliveryStatus.DONE,
        completedAt: { gte: weekStart },
      },
      select: { riderFee: true },
    }),
    prisma.delivery.findMany({
      where: {
        riderId: session.user.id,
        status: DeliveryStatus.DONE,
        completedAt: { gte: monthStart },
      },
      select: { riderFee: true },
    }),
  ]);

  const stats = {
    today: {
      count: todayDeliveries.length,
      earnings: todayDeliveries.reduce((sum, d) => sum + d.riderFee, 0),
    },
    week: {
      count: weekDeliveries.length,
      earnings: weekDeliveries.reduce((sum, d) => sum + d.riderFee, 0),
    },
    month: {
      count: monthDeliveries.length,
      earnings: monthDeliveries.reduce((sum, d) => sum + d.riderFee, 0),
    },
  };

  return (
    <div className="flex flex-col min-h-dvh">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-[20px] font-bold text-gray-900">수익 요약</h1>
      </header>

      <div className="flex-1 p-4">
        <EarningsDashboard stats={stats} />
      </div>
    </div>
  );
}
