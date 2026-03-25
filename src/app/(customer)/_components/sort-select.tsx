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
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-white scrollbar-hide">
      {sortEntries.map(([key, label]) => {
        const isActive = currentSort === key;
        return (
          <button
            key={key}
            onClick={() => handleSortChange(key)}
            className={cn(
              "flex shrink-0 items-center gap-0.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
              isActive
                ? "border-black bg-black font-semibold text-white"
                : "border-[#EEEEEE] bg-white text-gray-500 hover:bg-gray-50"
            )}
          >
            {label}
            <ChevronDown className={cn("size-3.5", isActive ? "text-white" : "text-gray-400")} />
          </button>
        );
      })}
    </div>
  );
}
