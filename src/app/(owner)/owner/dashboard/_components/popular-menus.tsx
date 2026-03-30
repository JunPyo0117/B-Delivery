import type { PopularMenu } from "../_actions/dashboard-actions";
import { Trophy } from "lucide-react";

interface PopularMenusProps {
  menus: PopularMenu[];
}

const RANK_COLORS = ["#FFB300", "#78909C", "#A1887F", "#90A4AE", "#B0BEC5"];

export function PopularMenus({ menus }: PopularMenusProps) {
  const totalRevenue = menus.reduce((sum, m) => sum + m.revenue, 0);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4" style={{ color: "#FFB300" }} />
        <h3 className="text-sm font-bold text-gray-900">인기 메뉴 TOP 5</h3>
      </div>

      {menus.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          오늘의 주문 데이터가 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {menus.map((menu, index) => {
            const revenuePercent =
              totalRevenue > 0
                ? Math.round((menu.revenue / totalRevenue) * 100)
                : 0;

            return (
              <div key={index} className="flex items-center gap-3">
                {/* 순위 */}
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: RANK_COLORS[index] ?? "#B0BEC5" }}
                >
                  {index + 1}
                </div>

                {/* 메뉴명 + 매출 비율 바 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {menu.menuName}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">
                      {menu.orderCount}건
                    </span>
                  </div>
                  {/* 비율 바 */}
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${revenuePercent}%`,
                        backgroundColor:
                          RANK_COLORS[index] ?? "#B0BEC5",
                      }}
                    />
                  </div>
                </div>

                {/* 매출 비율 */}
                <span className="text-xs font-medium text-gray-400 shrink-0 w-10 text-right">
                  {revenuePercent}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
