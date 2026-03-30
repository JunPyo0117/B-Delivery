import { Suspense } from "react";
import { getRiders, type RiderListParams } from "./actions";
import { RidersClient } from "./_components/riders-client";

export const metadata = { title: "배달기사 관리 | 관리자" };

interface Props {
  searchParams: Promise<{
    search?: string;
    online?: string;
    page?: string;
  }>;
}

export default async function AdminRidersPage({ searchParams }: Props) {
  const sp = await searchParams;

  const params: RiderListParams = {
    search: sp.search || "",
    onlineFilter:
      (sp.online as RiderListParams["onlineFilter"]) || "ALL",
    page: Number(sp.page) || 1,
    pageSize: 20,
  };

  return (
    <Suspense fallback={<RidersPageSkeleton />}>
      <RidersLoader params={params} />
    </Suspense>
  );
}

async function RidersLoader({ params }: { params: RiderListParams }) {
  const data = await getRiders(params);
  return <RidersClient initialData={data} initialParams={params} />;
}

function RidersPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="h-14" style={{ backgroundColor: "#1A1A2E" }} />
      <div className="space-y-3 p-3">
        <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
