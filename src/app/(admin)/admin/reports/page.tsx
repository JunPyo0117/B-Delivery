import { Suspense } from "react";
import { getReports, type ReportListParams } from "./actions";
import { ReportListClient } from "./_components/report-list-client";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

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
    <main className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">신고 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            신고 목록 조회 및 처리
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          대시보드로
        </Link>
      </div>

      <Suspense fallback={<ReportListSkeleton />}>
        <ReportListLoader params={params} />
      </Suspense>
    </main>
  );
}

async function ReportListLoader({ params }: { params: ReportListParams }) {
  const data = await getReports(params);
  return <ReportListClient initialData={data} initialParams={params} />;
}

function ReportListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
