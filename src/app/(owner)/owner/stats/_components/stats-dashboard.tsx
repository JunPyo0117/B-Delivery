"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  getSalesStats,
  getMenuRanking,
  type DailySalesData,
  type MenuRankingData,
} from "../_actions/stats-actions";
import { SalesChart } from "./sales-chart";
import { SalesTable } from "./sales-table";
import { MenuRanking } from "./menu-ranking";
import { CsvExport } from "./csv-export";

// ── 기간 프리셋 ─────────────────────────────────────────

type PeriodPreset = "today" | "week" | "month" | "custom";

interface PeriodOption {
  key: PeriodPreset;
  label: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: "today", label: "오늘" },
  { key: "week", label: "이번주" },
  { key: "month", label: "이번달" },
  { key: "custom", label: "직접선택" },
];

function getPresetDates(preset: PeriodPreset): {
  start: string;
  end: string;
} {
  const now = new Date();
  const end = formatDateISO(now);

  switch (preset) {
    case "today":
      return { start: end, end };

    case "week": {
      const monday = new Date(now);
      const dayOfWeek = now.getDay();
      // 월요일 기준 (일=0, 월=1, ..., 토=6)
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(now.getDate() - diff);
      return { start: formatDateISO(monday), end };
    }

    case "month": {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatDateISO(firstDay), end };
    }

    default:
      return { start: end, end };
  }
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── 메인 컴포넌트 ───────────────────────────────────────

interface StatsDashboardProps {
  restaurantId: string;
  restaurantName: string;
}

export function StatsDashboard({
  restaurantId,
  restaurantName,
}: StatsDashboardProps) {
  const [period, setPeriod] = useState<PeriodPreset>("today");
  const [startDate, setStartDate] = useState(() => getPresetDates("today").start);
  const [endDate, setEndDate] = useState(() => getPresetDates("today").end);

  const [salesData, setSalesData] = useState<DailySalesData[]>([]);
  const [menuData, setMenuData] = useState<MenuRankingData[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    (start: string, end: string) => {
      startTransition(async () => {
        setError(null);

        const [salesResult, menuResult] = await Promise.all([
          getSalesStats(restaurantId, start, end),
          getMenuRanking(restaurantId, start, end),
        ]);

        if (salesResult.error) {
          setError(salesResult.error);
          return;
        }
        if (menuResult.error) {
          setError(menuResult.error);
          return;
        }

        setSalesData(salesResult.data);
        setMenuData(menuResult.data);
      });
    },
    [restaurantId]
  );

  // 프리셋 변경 시 날짜 자동 설정 + 데이터 조회
  const handlePresetChange = (preset: PeriodPreset) => {
    setPeriod(preset);

    if (preset !== "custom") {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
      fetchData(start, end);
    }
  };

  // 직접선택 시 조회 버튼
  const handleCustomSearch = () => {
    if (startDate && endDate) {
      fetchData(startDate, endDate);
    }
  };

  // 초기 로드
  useEffect(() => {
    const { start, end } = getPresetDates("today");
    fetchData(start, end);
  }, [fetchData]);

  // 매출 요약 숫자 계산
  const totalSales = salesData.reduce((sum, d) => sum + d.totalSales, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orderCount, 0);

  return (
    <div>
      {/* 헤더 */}
      <div className="px-4 py-5" style={{ backgroundColor: "#2DB400" }}>
        <h1 className="text-lg font-bold text-white">매출 통계</h1>
        <p className="mt-0.5 text-sm text-white/70">{restaurantName}</p>
      </div>

      <div className="space-y-6 p-4">
        {/* 기간 선택 */}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-gray-700">기간</div>

          {/* 프리셋 버튼 */}
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                variant={period === opt.key ? "default" : "outline"}
                size="sm"
                onClick={() => handlePresetChange(opt.key)}
                style={
                  period === opt.key
                    ? { backgroundColor: "#2DB400", borderColor: "#2DB400" }
                    : {}
                }
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* 커스텀 날짜 입력 */}
          {period === "custom" && (
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
              <span className="text-sm text-gray-500">~</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
              <Button
                size="sm"
                onClick={handleCustomSearch}
                style={{ backgroundColor: "#2DB400" }}
              >
                조회
              </Button>
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-white p-4 text-center">
            <div className="text-xs font-medium text-gray-500">총 매출</div>
            {isPending ? (
              <Skeleton className="mx-auto mt-1 h-6 w-24" />
            ) : (
              <div
                className="mt-1 text-lg font-bold"
                style={{ color: "#2DB400" }}
              >
                {totalSales.toLocaleString("ko-KR")}원
              </div>
            )}
          </div>
          <div className="rounded-xl border bg-white p-4 text-center">
            <div className="text-xs font-medium text-gray-500">총 주문수</div>
            {isPending ? (
              <Skeleton className="mx-auto mt-1 h-6 w-16" />
            ) : (
              <div
                className="mt-1 text-lg font-bold"
                style={{ color: "#2DB400" }}
              >
                {totalOrders}건
              </div>
            )}
          </div>
        </div>

        {/* 로딩 또는 데이터 */}
        {isPending ? (
          <div className="space-y-6">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* 일별 매출 그래프 */}
            <SalesChart data={salesData} />

            {/* 매출 요약 테이블 */}
            <SalesTable data={salesData} />

            {/* 메뉴별 매출 순위 */}
            <MenuRanking data={menuData} />

            {/* CSV 다운로드 */}
            <div className="flex justify-end">
              <CsvExport
                data={salesData}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
