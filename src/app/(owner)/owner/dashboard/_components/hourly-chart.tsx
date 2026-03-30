"use client";

import type { HourlyOrderData } from "../_actions/dashboard-actions";

interface HourlyChartProps {
  data: HourlyOrderData[];
}

export function HourlyChart({ data }: HourlyChartProps) {
  const currentHour = new Date().getHours();
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-4">
        시간대별 주문 추이
      </h3>

      <div className="flex items-end gap-1 h-[140px]">
        {data.map((item) => {
          const heightPercent =
            maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const isCurrentHour = item.hour === currentHour;
          const hasOrders = item.count > 0;

          return (
            <div
              key={item.hour}
              className="flex flex-1 flex-col items-center justify-end h-full group relative"
            >
              {/* 툴팁 */}
              {hasOrders && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <span className="whitespace-nowrap rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {item.count}건
                  </span>
                </div>
              )}

              {/* 바 */}
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${Math.max(heightPercent, hasOrders ? 8 : 2)}%`,
                  backgroundColor: isCurrentHour ? "#2DB400" : "#D1D5DB",
                  minHeight: hasOrders ? "4px" : "1px",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X축 라벨 */}
      <div className="flex gap-1 mt-2">
        {data.map((item) => (
          <div
            key={item.hour}
            className="flex-1 text-center"
          >
            {item.hour % 3 === 0 && (
              <span className="text-[10px] text-gray-400">
                {String(item.hour).padStart(2, "0")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
