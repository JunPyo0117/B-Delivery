"use client";

import { KpiCards } from "./kpi-cards";
import { DailyStatsChart } from "./daily-stats-chart";
import type { DashboardData } from "../_actions/get-dashboard-data";

interface Props {
  data: DashboardData;
  nickname: string;
}

export function DashboardClient({ data }: Props) {
  return (
    <div className="min-h-screen bg-[#F0F0F4] p-6">
      {/* 페이지 제목 */}
      <h1 className="mb-6 text-[22px] font-bold text-foreground">
        관리자 대시보드
      </h1>

      {/* KPI 카드 5개 가로 배치 */}
      <div className="mb-6">
        <KpiCards data={data.kpi} />
      </div>

      {/* 주문/매출 추이 차트 */}
      <div className="mb-6">
        <DailyStatsChart data={data.dailyStats} />
      </div>
    </div>
  );
}
