import { Suspense } from "react";
import { getUsers, type UserListParams } from "./actions";
import { UserListClient } from "./_components/user-list-client";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export const metadata = { title: "유저 관리 | 관리자" };

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
    <main className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">유저 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            회원 목록 조회 및 관리
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          대시보드로
        </Link>
      </div>

      <Suspense fallback={<UserListSkeleton />}>
        <UserListLoader params={params} />
      </Suspense>
    </main>
  );
}

async function UserListLoader({ params }: { params: UserListParams }) {
  const data = await getUsers(params);
  return <UserListClient initialData={data} initialParams={params} />;
}

function UserListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
