"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SORT_OPTIONS, type SortOption } from "@/lib/constants";
import { cn } from "@/lib/utils";

const sortEntries = Object.entries(SORT_OPTIONS) as [SortOption, string][];

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = (searchParams.get("sort") as SortOption) ?? "distance";

  const handleSortChange = (sort: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "distance") {
      // 기본값이면 URL에서 제거
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
      {sortEntries.map(([key, label]) => {
        const isActive = currentSort === key;
        return (
          <button
            key={key}
            onClick={() => handleSortChange(key)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors",
              isActive
                ? "border-[#2AC1BC] bg-[#2AC1BC]/10 font-bold text-[#2AC1BC]"
                : "border-gray-200 text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
            {isActive && <ChevronDown className="size-3" />}
          </button>
        );
      })}
    </div>
  );
}
