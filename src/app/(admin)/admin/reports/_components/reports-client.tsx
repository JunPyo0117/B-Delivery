"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportListItem, ReportListParams } from "../actions";

const TARGET_TYPE_LABELS: Record<string, string> = {
  USER: "유저",
  RESTAURANT: "음식점",
  MENU: "메뉴",
  CHAT: "채팅",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "대기중",
  RESOLVED: "처리됨",
  REJECTED: "기각",
};

interface Props {
  initialData: {
    reports: ReportListItem[];
    total: number;
    totalPages: number;
    page: number;
  };
  initialParams: ReportListParams;
}

export function ReportsClient({ initialData, initialParams }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const pendingCount = initialData.reports.filter(
    (r) => r.status === "PENDING"
  ).length;

  function navigate(overrides: Partial<ReportListParams>) {
    const merged = { ...initialParams, ...overrides };
    const sp = new URLSearchParams();
    if (merged.targetType && merged.targetType !== "ALL")
      sp.set("targetType", merged.targetType);
    if (merged.status && merged.status !== "ALL")
      sp.set("status", merged.status);
    if (merged.page && merged.page > 1) sp.set("page", String(merged.page));

    startTransition(() => {
      router.push(`/admin/reports?${sp.toString()}`);
    });
  }

  function getTargetName(report: ReportListItem) {
    switch (report.targetType) {
      case "USER":
        return report.targetUser?.nickname || "알 수 없음";
      case "RESTAURANT":
        return report.targetRestaurant?.name || "알 수 없음";
      case "MENU":
        return report.targetMenu?.name || "알 수 없음";
      case "CHAT":
        return "채팅 메시지";
      default:
        return "-";
    }
  }

  function formatDate(iso: string | Date): string {
    const date = new Date(iso);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Dark Header */}
      <header
        className="flex items-center gap-3 px-4 py-4"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <Link href="/admin/dashboard" className="text-white/80 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-white">신고 관리</h1>
        {initialData.total > 0 && (
          <span
            className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
            style={{ backgroundColor: "#FF5252" }}
          >
            {initialData.total}
          </span>
        )}
      </header>

      {/* Report Cards */}
      <div className="flex-1 px-3 py-3 space-y-2">
        {initialData.reports.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            신고 내역이 없습니다.
          </div>
        ) : (
          initialData.reports.map((report) => (
            <Link
              key={report.id}
              href={`/admin/reports/${report.id}`}
              className="block rounded-xl bg-white px-4 py-3.5 active:bg-gray-50"
            >
              {/* Header: status badge + date */}
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    report.status === "PENDING"
                      ? "bg-orange-100 text-orange-600"
                      : report.status === "RESOLVED"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {STATUS_LABELS[report.status] || report.status}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(report.createdAt)}
                </span>
              </div>

              {/* Reporter -> Target info */}
              <p className="mt-2 text-[13px] text-gray-700">
                <span className="font-medium">{report.reporter.nickname}</span>
                <span className="mx-1 text-gray-400">&rarr;</span>
                <span className="font-medium">{getTargetName(report)}</span>
                <span className="ml-1 text-gray-400">
                  ({TARGET_TYPE_LABELS[report.targetType] || report.targetType})
                </span>
              </p>

              {/* Reason */}
              <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                {report.reason}
                {report.description ? ` - ${report.description}` : ""}
              </p>

              {/* Action buttons for pending */}
              {report.status === "PENDING" && (
                <div className="mt-2.5 flex gap-2">
                  <span className="flex-1 rounded-lg border border-gray-300 py-1.5 text-center text-xs font-medium text-gray-600">
                    기각
                  </span>
                  <span
                    className="flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-white"
                    style={{ backgroundColor: "#FF5252" }}
                  >
                    제재
                  </span>
                </div>
              )}
            </Link>
          ))
        )}

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              disabled={initialData.page <= 1 || isPending}
              onClick={() => navigate({ page: initialData.page - 1 })}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500">
              {initialData.page} / {initialData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={
                initialData.page >= initialData.totalPages || isPending
              }
              onClick={() => navigate({ page: initialData.page + 1 })}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
