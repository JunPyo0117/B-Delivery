import { Suspense } from "react";
import { getMonitoringData } from "./actions";
import { MonitoringClient } from "./_components/monitoring-client";

export const metadata = { title: "배달 현황 모니터링 | 관리자" };

export default async function AdminMonitoringPage() {
  return (
    <Suspense fallback={<MonitoringPageSkeleton />}>
      <MonitoringLoader />
    </Suspense>
  );
}

async function MonitoringLoader() {
  const data = await getMonitoringData();
  return <MonitoringClient initialData={data} />;
}

function MonitoringPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="h-14" style={{ backgroundColor: "#1A1A2E" }} />
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
