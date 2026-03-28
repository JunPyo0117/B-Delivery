"use client";

import type { DailySalesData } from "../_actions/stats-actions";

interface SalesChartProps {
  data: DailySalesData[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}/${day}(${weekday})`;
}

export function SalesChart({ data }: SalesChartProps) {
  const maxSales = Math.max(...data.map((d) => d.totalSales), 1);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          일별 매출 그래프
        </h3>
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
          데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        일별 매출 그래프
      </h3>

      <div className="relative">
        {/* 차트 영역 */}
        <div
          className="flex items-end gap-1 overflow-x-auto pb-8"
          style={{ minHeight: 200 }}
        >
          {data.map((item) => {
            const heightPercent =
              maxSales > 0 ? (item.totalSales / maxSales) * 100 : 0;
            const barHeight = Math.max(heightPercent, item.totalSales > 0 ? 4 : 0);

            return (
              <div
                key={item.date}
                className="group relative flex flex-1 min-w-[32px] flex-col items-center"
              >
                {/* 호버 시 금액 표시 */}
                <div className="absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs text-white whitespace-nowrap group-hover:block">
                  {item.totalSales.toLocaleString("ko-KR")}원
                </div>

                {/* 바 */}
                <div
                  className="relative w-full max-w-[40px] cursor-pointer rounded-t transition-opacity group-hover:opacity-80"
                  style={{
                    height: `${barHeight}%`,
                    minHeight: item.totalSales > 0 ? 8 : 0,
                    backgroundColor: "#2DB400",
                    maxHeight: 160,
                  }}
                />

                {/* 날짜 라벨 */}
                <span className="absolute -bottom-6 text-[10px] text-gray-500 whitespace-nowrap">
                  {formatShortDate(item.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
