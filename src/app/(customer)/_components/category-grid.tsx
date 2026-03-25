"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const categories = Object.entries(CATEGORY_LABELS) as [string, string][];

export function CategoryGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeCategory === category) {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <section className="px-4 py-4">
      <div className="grid grid-cols-5 gap-x-2 gap-y-3">
        {categories.map(([key, label]) => {
          const icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
          const isActive = activeCategory === key;

          return (
            <button
              key={key}
              onClick={() => handleCategoryClick(key)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg p-2 transition-colors",
                isActive
                  ? "bg-[#2AC1BC]/10 ring-1 ring-[#2AC1BC]"
                  : "hover:bg-muted"
              )}
            >
              <span className="text-2xl">{icon}</span>
              <span
                className={cn(
                  "text-[11px] leading-tight",
                  isActive
                    ? "font-bold text-[#2AC1BC]"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
