"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UserListItem, UserListParams } from "../actions";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  ALL: "전체 역할",
  USER: "일반 유저",
  OWNER: "사장님",
  ADMIN: "관리자",
};

const STATUS_LABELS: Record<string, string> = {
  ALL: "전체 상태",
  ACTIVE: "활성",
  BANNED: "정지",
  WITHDRAWN: "탈퇴",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  BANNED: "destructive",
  WITHDRAWN: "secondary",
};

interface Props {
  initialData: {
    users: UserListItem[];
    total: number;
    totalPages: number;
    page: number;
  };
  initialParams: UserListParams;
}

export function UserListClient({ initialData, initialParams }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialParams.search || "");

  function navigate(overrides: Partial<UserListParams>) {
    const merged = { ...initialParams, ...overrides };
    const sp = new URLSearchParams();
    if (merged.search) sp.set("search", merged.search);
    if (merged.role && merged.role !== "ALL") sp.set("role", merged.role);
    if (merged.status && merged.status !== "ALL")
      sp.set("status", merged.status);
    if (merged.page && merged.page > 1) sp.set("page", String(merged.page));

    startTransition(() => {
      router.push(`/admin/users?${sp.toString()}`);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search, page: 1 });
  }

  return (
    <div className="space-y-4">
      {/* 검색 + 필터 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="닉네임 또는 이메일 검색"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={isPending}>
            검색
          </Button>
        </form>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={initialParams.role || "ALL"}
          onChange={(e) =>
            navigate({ role: e.target.value as UserListParams["role"], page: 1 })
          }
        >
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
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
              status: e.target.value as UserListParams["status"],
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

      {/* 결과 */}
      <div className="text-sm text-muted-foreground">
        총 {initialData.total}명
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">닉네임</th>
              <th className="px-4 py-3 text-left font-medium">이메일</th>
              <th className="px-4 py-3 text-left font-medium">역할</th>
              <th className="px-4 py-3 text-left font-medium">상태</th>
              <th className="px-4 py-3 text-left font-medium">주문수</th>
              <th className="px-4 py-3 text-left font-medium">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {initialData.users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              initialData.users.map((user) => (
                <tr
                  key={user.id}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {user.nickname}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[user.status] || "secondary"}>
                      {STATUS_LABELS[user.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{user._count.orders}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
