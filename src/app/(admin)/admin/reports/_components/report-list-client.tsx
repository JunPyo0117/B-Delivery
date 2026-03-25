"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReportListItem, ReportListParams } from "../actions";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TARGET_TYPE_LABELS: Record<string, string> = {
  ALL: "전체 유형",
  USER: "유저",
  RESTAURANT: "음식점",
  MENU: "메뉴",
  CHAT: "채팅",
};

const STATUS_LABELS: Record<string, string> = {
  ALL: "전체 상태",
  PENDING: "대기",
  RESOLVED: "처리됨",
  REJECTED: "기각",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  RESOLVED: "default",
  REJECTED: "secondary",
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

export function ReportListClient({ initialData, initialParams }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex gap-3">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={initialParams.targetType || "ALL"}
          onChange={(e) =>
            navigate({
              targetType: e.target.value as ReportListParams["targetType"],
              page: 1,
            })
          }
        >
          {Object.entries(TARGET_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={initialParams.status || "ALL"}
          onChange={(e) =>
            navigate({
              status: e.target.value as ReportListParams["status"],
              page: 1,
            })
          }
        >
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-muted-foreground">
        총 {initialData.total}건
      </div>

      {/* 신고 카드 리스트 */}
      <div className="space-y-3">
        {initialData.reports.length === 0 ? (
          <div className="rounded-lg border py-12 text-center text-muted-foreground">
            신고 내역이 없습니다.
          </div>
        ) : (
          initialData.reports.map((report) => (
            <Link
              key={report.id}
              href={`/admin/reports/${report.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {TARGET_TYPE_LABELS[report.targetType]}
                    </Badge>
                    <Badge variant={STATUS_VARIANT[report.status]}>
                      {STATUS_LABELS[report.status]}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{report.reason}</p>
                  {report.description && (
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {report.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-3">
                  <span>신고자: {report.reporter.nickname}</span>
                  <span>대상: {getTargetName(report)}</span>
                </div>
                <span>
                  {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {initialData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={initialData.page <= 1 || isPending}
            onClick={() => navigate({ page: initialData.page - 1 })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {initialData.page} / {initialData.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={
              initialData.page >= initialData.totalPages || isPending
            }
            onClick={() => navigate({ page: initialData.page + 1 })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
