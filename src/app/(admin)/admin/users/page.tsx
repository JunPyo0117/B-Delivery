import { Suspense } from "react";
import { getUsers, type UserListParams } from "./actions";
import { UsersClient } from "./_components/users-client";

export const metadata = { title: "사용자 관리 | 관리자" };

interface Props {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;

  const params: UserListParams = {
    search: sp.search || "",
    role: (sp.role as UserListParams["role"]) || "ALL",
    status: (sp.status as UserListParams["status"]) || "ALL",
    page: Number(sp.page) || 1,
    pageSize: 20,
  };

  return (
    <Suspense fallback={<UsersPageSkeleton />}>
      <UsersLoader params={params} />
    </Suspense>
  );
}

async function UsersLoader({ params }: { params: UserListParams }) {
  const data = await getUsers(params);
  return <UsersClient initialData={data} initialParams={params} />;
}

function UsersPageSkeleton() {
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
