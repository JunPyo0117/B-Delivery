"use client";

import type { DailySalesData } from "../_actions/stats-actions";

interface SalesTableProps {
  data: DailySalesData[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}/${day}(${weekday})`;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

export function SalesTable({ data }: SalesTableProps) {
  // 합계 계산
  const totals = data.reduce(
    (acc, item) => ({
      totalSales: acc.totalSales + item.totalSales,
      orderCount: acc.orderCount + item.orderCount,
      deliveryFeeIncome: acc.deliveryFeeIncome + item.deliveryFeeIncome,
    }),
    { totalSales: 0, orderCount: 0, deliveryFeeIncome: 0 }
  );

  const totalAvgPrice =
    totals.orderCount > 0
      ? Math.round(totals.totalSales / totals.orderCount)
      : 0;

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">
          매출 요약 테이블
        </h3>
        <div className="flex h-24 items-center justify-center text-sm text-gray-400">
          데이터가 없습니다.
        </div>
      </div>
    );
  }

  // 최신 날짜 순으로 정렬
  const sortedData = [...data].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="rounded-xl border bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">
        매출 요약 테이블
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">
                날짜
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">
                매출
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">
                주문수
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">
                평균금액
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">
                배달비 수입
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr
                key={item.date}
                className="border-b border-gray-100 last:border-b-0"
              >
                <td className="px-3 py-2.5 text-gray-700">
                  {formatDate(item.date)}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                  {formatCurrency(item.totalSales)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700">
                  {item.orderCount}건
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700">
                  {formatCurrency(item.avgPrice)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-700">
                  {formatCurrency(item.deliveryFeeIncome)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-semibold">
              <td className="px-3 py-2.5 text-gray-900">합계</td>
              <td className="px-3 py-2.5 text-right text-gray-900">
                {formatCurrency(totals.totalSales)}
              </td>
              <td className="px-3 py-2.5 text-right text-gray-900">
                {totals.orderCount}건
              </td>
              <td className="px-3 py-2.5 text-right text-gray-900">
                {formatCurrency(totalAvgPrice)}
              </td>
              <td className="px-3 py-2.5 text-right text-gray-900">
                {formatCurrency(totals.deliveryFeeIncome)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
