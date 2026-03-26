import { Suspense } from "react";
import { getReports, type ReportListParams } from "./actions";
import { ReportsClient } from "./_components/reports-client";

export const metadata = { title: "신고 관리 | 관리자" };

interface Props {
  searchParams: Promise<{
    targetType?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const params: ReportListParams = {
    targetType:
      (sp.targetType as ReportListParams["targetType"]) || "ALL",
    status: (sp.status as ReportListParams["status"]) || "ALL",
    page: Number(sp.page) || 1,
    pageSize: 20,
  };

  return (
    <Suspense fallback={<ReportsPageSkeleton />}>
      <ReportsLoader params={params} />
    </Suspense>
  );
}

async function ReportsLoader({ params }: { params: ReportListParams }) {
  const data = await getReports(params);
  return <ReportsClient initialData={data} initialParams={params} />;
}

function ReportsPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="h-14" style={{ backgroundColor: "#1A1A2E" }} />
      <div className="space-y-3 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
