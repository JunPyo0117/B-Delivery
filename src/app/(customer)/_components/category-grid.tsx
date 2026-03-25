"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const categories = Object.entries(CATEGORY_LABELS) as [string, string][];

/** 카테고리별 파스텔 배경색 */
const CATEGORY_BG: Record<string, string> = {
  KOREAN: "bg-orange-50",
  CHINESE: "bg-red-50",
  JAPANESE: "bg-amber-50",
  CHICKEN: "bg-yellow-50",
  PIZZA: "bg-rose-50",
  BUNSIK: "bg-pink-50",
  JOKBAL: "bg-fuchsia-50",
  CAFE: "bg-sky-50",
  FASTFOOD: "bg-lime-50",
  ETC: "bg-slate-50",
};

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
    <section className="bg-white px-4 pt-2 pb-4">
      <h2 className="text-[15px] font-bold text-black mb-3">음식배달</h2>
      <div className="grid grid-cols-5 gap-x-1 gap-y-4">
        {categories.map(([key, label]) => {
          const icon = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
          const isActive = activeCategory === key;
          const bgColor = CATEGORY_BG[key] ?? "bg-gray-50";

          return (
            <button
              key={key}
              onClick={() => handleCategoryClick(key)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={cn(
                  "flex items-center justify-center size-12 rounded-full transition-all",
                  bgColor,
                  isActive && "ring-2 ring-[#2DB400] ring-offset-1"
                )}
              >
                <span className="text-[22px]">{icon}</span>
              </div>
              <span
                className={cn(
                  "text-[11px] leading-tight text-center",
                  isActive
                    ? "font-bold text-[#2DB400]"
                    : "text-gray-600"
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
