"use client";

import type { DailyStat } from "../_actions/get-dashboard-data";

interface Props {
  data: DailyStat[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatRevenue(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}백만`;
  }
  if (value >= 10_000) {
    return `${Math.round(value / 10_000)}만`;
  }
  return value.toLocaleString();
}

export function DailyStatsChart({ data }: Props) {
  const maxOrderCount = Math.max(...data.map((d) => d.orderCount), 1);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orderCount, 0);

  return (
    <div className="rounded-xl bg-card p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">
          주문/매출 추이 (최근 7일)
        </h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#2DB400]" />
            <span className="text-muted-foreground">주문수</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-gray-300" />
            <span className="text-muted-foreground">매출</span>
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-[#F0F0F4] p-4">
          <span className="text-xs text-muted-foreground">7일 총 주문</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">
              {totalOrders.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">건</span>
          </div>
        </div>
        <div className="rounded-lg bg-[#F0F0F4] p-4">
          <span className="text-xs text-muted-foreground">7일 총 매출</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-bold text-foreground">
              {totalRevenue.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">원</span>
          </div>
        </div>
      </div>

      {/* 바 차트 */}
      <div className="flex items-end gap-3" style={{ height: 220 }}>
        {data.map((stat) => {
          const barHeight =
            maxOrderCount > 0
              ? Math.max((stat.orderCount / maxOrderCount) * 160, 4)
              : 4;

          return (
            <div
              key={stat.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              {/* 주문수 라벨 */}
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {stat.orderCount}
              </span>

              {/* 바 */}
              <div
                className="w-full max-w-[48px] rounded-t-md bg-[#2DB400] transition-all duration-300"
                style={{ height: barHeight }}
              />

              {/* 매출 라벨 */}
              <span className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                {formatRevenue(stat.revenue)}원
              </span>

              {/* 날짜 */}
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatDate(stat.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
