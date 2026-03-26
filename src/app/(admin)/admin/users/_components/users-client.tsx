"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserListItem, UserListParams } from "../actions";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "활동중",
  BANNED: "정지",
  WITHDRAWN: "탈퇴",
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

export function UsersClient({ initialData, initialParams }: Props) {
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Dark Header */}
      <header
        className="flex items-center gap-3 px-4 py-4"
        style={{ backgroundColor: "#1A1A2E" }}
      >
        <Link href="/admin/dashboard" className="text-white/80 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-white">사용자 관리</h1>
      </header>

      {/* Search Bar */}
      <div className="px-3 py-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="닉네임 또는 이메일 검색"
              className="h-10 w-full rounded-lg bg-gray-200 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </form>
      </div>

      {/* User List */}
      <div className="flex-1 px-3">
        {initialData.users.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="space-y-0 overflow-hidden rounded-xl bg-white">
            {initialData.users.map((user, idx) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className={`flex items-center justify-between px-4 py-3 active:bg-gray-50 ${
                  idx < initialData.users.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar Circle */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-500">
                        {user.nickname?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">
                      {user.nickname}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 truncate">
                        {user.email}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span
                        className={`text-xs font-medium ${
                          user.status === "BANNED"
                            ? "text-red-500"
                            : user.status === "WITHDRAWN"
                              ? "text-orange-500"
                              : "text-gray-500"
                        }`}
                      >
                        {STATUS_LABELS[user.status] || user.status}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
              </Link>
            ))}
          </div>
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
