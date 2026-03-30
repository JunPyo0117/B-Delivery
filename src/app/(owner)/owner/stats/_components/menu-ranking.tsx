"use client";

import type { MenuRankingData } from "../_actions/stats-actions";

interface MenuRankingProps {
  data: MenuRankingData[];
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

export function MenuRanking({ data }: MenuRankingProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          메뉴별 매출 순위
        </h3>
        <div className="flex h-24 items-center justify-center text-sm text-gray-400">
          데이터가 없습니다.
        </div>
      </div>
    );
  }

  const maxPercentage = Math.max(...data.map((d) => d.percentage), 1);

  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        메뉴별 매출 순위
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-12 px-3 py-2.5 text-left font-semibold text-gray-600">
                순위
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">
                메뉴명
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">
                판매량
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">
                매출
              </th>
              <th className="min-w-[140px] px-3 py-2.5 text-left font-semibold text-gray-600">
                기여도
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.menuId}
                className="border-b border-gray-100 last:border-b-0"
              >
                <td className="px-3 py-2.5 font-semibold text-gray-500">
                  {index + 1}
                </td>
                <td className="px-3 py-2.5 font-medium text-gray-900">
                  {item.menuName}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700">
                  {item.quantity}건
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                  {formatCurrency(item.revenue)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(item.percentage / maxPercentage) * 100}%`,
                          backgroundColor: "#2DB400",
                        }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-medium text-gray-600">
                      {item.percentage}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
