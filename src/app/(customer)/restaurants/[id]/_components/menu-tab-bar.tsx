"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MenuTabBarProps {
  categories: string[];
}

export function MenuTabBar({ categories }: MenuTabBarProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const tabsRef = useRef<HTMLDivElement>(null);

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
      className="sticky top-0 z-40 overflow-x-auto border-b bg-background"
    >
      <div className="flex gap-0 px-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleTabClick(category)}
            className={cn(
              "flex-shrink-0 whitespace-nowrap px-3 py-3 text-sm transition-colors",
              activeCategory === category
                ? "border-b-2 border-foreground font-bold text-foreground"
                : "text-muted-foreground"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
