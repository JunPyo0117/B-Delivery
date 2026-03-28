"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { DailySalesData } from "../_actions/stats-actions";

interface CsvExportProps {
  data: DailySalesData[];
  startDate: string;
  endDate: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}/${day}(${weekday})`;
}

function formatFileDate(dateStr: string): string {
  return dateStr; // YYYY-MM-DD 형식 그대로 사용
}

export function CsvExport({ data, startDate, endDate }: CsvExportProps) {
  const handleDownload = () => {
    // BOM + CSV 헤더
    const bom = "\uFEFF";
    const header = "날짜,매출,주문수,평균금액,배달비 수입\n";

    // 데이터 행
    const rows = data
      .map(
        (item) =>
          `${formatDate(item.date)},${item.totalSales},${item.orderCount},${item.avgPrice},${item.deliveryFeeIncome}`
      )
      .join("\n");

    // 합계 행
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

    const totalRow = `\n합계,${totals.totalSales},${totals.orderCount},${totalAvgPrice},${totals.deliveryFeeIncome}`;

    const csvContent = bom + header + rows + totalRow;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const filename = `매출통계_${formatFileDate(startDate)}_${formatFileDate(endDate)}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleDownload}
      disabled={data.length === 0}
      className="gap-2"
    >
      <Download className="size-4" />
      CSV 다운로드
    </Button>
  );
}
