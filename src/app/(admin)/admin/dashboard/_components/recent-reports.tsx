import Link from "next/link";
import type { RecentReport } from "../_actions/get-dashboard-data";

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "대기", className: "bg-yellow-100 text-yellow-800" },
  RESOLVED: { label: "처리완료", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "반려", className: "bg-gray-100 text-gray-800" },
};

const targetTypeLabels: Record<string, string> = {
  USER: "사용자",
  RESTAURANT: "음식점",
  MENU: "메뉴",
  CHAT: "채팅",
};

interface RecentReportsProps {
  data: RecentReport[];
}

export function RecentReports({ data }: RecentReportsProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h3 className="mb-4 text-base font-semibold">최근 신고</h3>
        <p className="py-8 text-center text-sm text-muted-foreground">
          신고 내역이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">최근 신고</h3>
        <Link
          href="/admin/reports"
          className="text-xs text-primary hover:underline"
        >
          전체 보기
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">신고자</th>
              <th className="pb-2 font-medium">대상</th>
              <th className="pb-2 font-medium">사유</th>
              <th className="pb-2 font-medium">상태</th>
              <th className="pb-2 font-medium">일시</th>
            </tr>
          </thead>
          <tbody>
            {data.map((report) => {
              const status = statusLabels[report.status] || {
                label: report.status,
                className: "bg-gray-100 text-gray-800",
              };
              return (
                <tr key={report.id} className="border-b last:border-0">
                  <td className="py-2.5">{report.reporterName}</td>
                  <td className="py-2.5">
                    {targetTypeLabels[report.targetType] || report.targetType}
                  </td>
                  <td className="max-w-[200px] truncate py-2.5">
                    {report.reason}
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground">
                    {formatDate(report.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}
