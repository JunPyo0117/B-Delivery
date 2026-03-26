"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface MenuTabBarProps {
  categories: string[];
}

export function MenuTabBar({ categories }: MenuTabBarProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const category of categories) {
      const el = document.getElementById(`menu-category-${category}`);
      if (!el) continue;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActiveCategory(category);
            }
          }
        },
        { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    }

    return () => {
      for (const observer of observers) {
        observer.disconnect();
      }
    };
  }, [categories]);

  // 활성 탭이 바뀌면 스크롤해서 보이게 하기
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory]);

  const handleTabClick = (category: string) => {
    setActiveCategory(category);
    const el = document.getElementById(`menu-category-${category}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      ref={tabsRef}
      className="sticky top-0 z-40 border-b border-gray-200 bg-white"
    >
      <div className="flex items-center">
        {/* 검색 아이콘 */}
        <div className="flex shrink-0 items-center pl-4 pr-1">
          <Search className="size-4 text-gray-400" />
        </div>

        {/* 스크롤 가능한 탭 */}
        <div className="flex flex-1 gap-0 overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                ref={isActive ? activeRef : undefined}
                onClick={() => handleTabClick(category)}
                className={cn(
                  "relative flex-shrink-0 whitespace-nowrap px-3 py-3 text-sm transition-colors",
                  isActive
                    ? "font-bold text-black"
                    : "font-medium text-gray-400"
                )}
              >
                {category}
                {isActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-black" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
