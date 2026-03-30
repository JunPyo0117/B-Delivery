"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { RiderListItem, RiderListParams } from "../actions";

const TRANSPORT_LABELS: Record<string, string> = {
  WALK: "도보",
  BICYCLE: "자전거",
  MOTORCYCLE: "오토바이",
  CAR: "자동차",
};

const ONLINE_FILTER_TABS: { label: string; value: RiderListParams["onlineFilter"] }[] = [
  { label: "전체", value: "ALL" },
  { label: "온라인", value: "ONLINE" },
  { label: "오프라인", value: "OFFLINE" },
];

interface Props {
  initialData: {
    riders: RiderListItem[];
    total: number;
    totalPages: number;
    page: number;
  };
  initialParams: RiderListParams;
}

export function RidersClient({ initialData, initialParams }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialParams.search || "");

  function navigate(overrides: Partial<RiderListParams>) {
    const merged = { ...initialParams, ...overrides };
    const sp = new URLSearchParams();
    if (merged.search) sp.set("search", merged.search);
    if (merged.onlineFilter && merged.onlineFilter !== "ALL")
      sp.set("online", merged.onlineFilter);
    if (merged.page && merged.page > 1) sp.set("page", String(merged.page));

    startTransition(() => {
      router.push(`/admin/riders?${sp.toString()}`);
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
        <h1 className="text-lg font-bold text-white">배달기사 관리</h1>
      </header>

      {/* Search Bar */}
      <div className="px-3 py-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="닉네임 검색"
              className="h-10 w-full rounded-lg bg-gray-200 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </form>
      </div>

      {/* Online/Offline Filter Tabs */}
      <div className="flex gap-2 px-3 pb-3">
        {ONLINE_FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => navigate({ onlineFilter: tab.value, page: 1 })}
            disabled={isPending}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              initialParams.onlineFilter === tab.value ||
              (!initialParams.onlineFilter && tab.value === "ALL")
                ? "bg-gray-900 text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rider List */}
      <div className="flex-1 px-3">
        {initialData.riders.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="space-y-0 overflow-hidden rounded-xl bg-white">
            {initialData.riders.map((rider, idx) => (
              <Link
                key={rider.id}
                href={`/admin/riders/${rider.id}`}
                className={`flex items-center justify-between px-4 py-3 active:bg-gray-50 ${
                  idx < initialData.riders.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar Circle */}
                  <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                    {rider.image ? (
                      <img
                        src={rider.image}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-500">
                        {rider.nickname?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    )}
                    {/* Online indicator */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        rider.isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">
                        {rider.nickname}
                      </p>
                      {rider.status === "BANNED" && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                          정지
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">
                        {TRANSPORT_LABELS[rider.transportType] || rider.transportType}
                      </span>
                      <span className="text-xs text-gray-300">|</span>
                      <span className="text-xs text-gray-500">
                        배달 {rider.totalDeliveries}건
                      </span>
                      {rider.avgDeliveryTime !== null && (
                        <>
                          <span className="text-xs text-gray-300">|</span>
                          <span className="text-xs text-gray-500">
                            평균 {rider.avgDeliveryTime}분
                          </span>
                        </>
                      )}
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
