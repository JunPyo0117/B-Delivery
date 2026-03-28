"use client";

import { useState } from "react";
import { Wallet, Package, TrendingUp, BarChart3 } from "lucide-react";
import { cn, formatPrice } from "@/shared/lib";

type TabKey = "today" | "week" | "month";

interface PeriodStats {
  count: number;
  earnings: number;
}

interface EarningsDashboardProps {
  stats: Record<TabKey, PeriodStats>;
}

const TAB_LABELS: Record<TabKey, string> = {
  today: "오늘",
  week: "이번 주",
  month: "이번 달",
};

/**
 * 수익 요약 대시보드
 * - 탭: 오늘 / 이번 주 / 이번 달
 * - KPI: 총 수익, 배달 건수
 * - 차트 플레이스홀더
 */
export function EarningsDashboard({ stats }: EarningsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const currentStats = stats[activeTab];

  // 평균 배달비 계산
  const avgFee =
    currentStats.count > 0
      ? Math.round(currentStats.earnings / currentStats.count)
      : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 탭 */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors",
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      {/* 총 수익 KPI */}
      <div className="rounded-2xl bg-[#2DB400] p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="size-5" />
          <p className="text-[13px] text-white/80">
            {TAB_LABELS[activeTab]} 총 수익
          </p>
        </div>
        <p className="text-[28px] font-bold">
          {formatPrice(currentStats.earnings)}
        </p>
      </div>

      {/* 세부 KPI */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="size-4 text-blue-500" />
            <p className="text-[12px] text-gray-500">배달 건수</p>
          </div>
          <p className="text-[20px] font-bold text-gray-900">
            {currentStats.count}건
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-[#2DB400]" />
            <p className="text-[12px] text-gray-500">평균 배달비</p>
          </div>
          <p className="text-[20px] font-bold text-gray-900">
            {formatPrice(avgFee)}
          </p>
        </div>
      </div>

      {/* 목표 수익 달성률 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <h3 className="text-[14px] font-bold text-gray-900 mb-3">🎯 목표 달성률</h3>
        {(() => {
          const dailyGoal = 100000;
          const progress = Math.min(100, Math.round((currentStats.earnings / dailyGoal) * 100));
          return (
            <div>
              <div className="flex justify-between text-[12px] text-gray-500 mb-2">
                <span>{formatPrice(currentStats.earnings)}</span>
                <span>{formatPrice(dailyGoal)}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#2DB400] rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-[13px] font-bold text-[#2DB400] mt-2">{progress}% 달성</p>
            </div>
          );
        })()}
      </div>

      {/* 시간대별 배달 히트맵 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <h3 className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="size-4 text-[#2DB400]" />
          시간대별 배달 현황
        </h3>
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 24 }, (_, h) => {
            const intensity = h >= 11 && h <= 13 ? 3 : h >= 17 && h <= 21 ? 3 : h >= 9 && h <= 22 ? 1 : 0;
            const colors = ["bg-gray-100", "bg-green-200", "bg-green-300", "bg-green-500"];
            return (
              <div key={h} className="flex flex-col items-center gap-0.5">
                <div className={`w-full aspect-square rounded-sm ${colors[intensity]}`} />
                {h % 4 === 0 && <span className="text-[9px] text-gray-400">{h}시</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
