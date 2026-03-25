"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { RestaurantCard } from "./restaurant-card";
import type {
  RestaurantListItem,
  RestaurantListResponse,
} from "@/types/restaurant";

interface RestaurantListProps {
  initialRestaurants: RestaurantListItem[];
  initialNextCursor: number | null;
}

export function RestaurantList({
  initialRestaurants,
  initialNextCursor,
}: RestaurantListProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const sort = searchParams.get("sort");

  const [restaurants, setRestaurants] =
    useState<RestaurantListItem[]>(initialRestaurants);
  const [nextCursor, setNextCursor] = useState<number | null>(
    initialNextCursor
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevFilterRef = useRef<string | null>(null);

  // 카테고리 또는 정렬 변경 시 리스트 재로드
  useEffect(() => {
    const filterKey = `${category ?? ""}_${sort ?? ""}`;
    if (prevFilterRef.current === filterKey) return;
    prevFilterRef.current = filterKey;

    // 초기 로드 시에는 서버 데이터 사용
    if (category === null && sort === null && restaurants === initialRestaurants)
      return;

    const fetchFiltered = async () => {
      setInitialLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (sort) params.set("sort", sort);
        params.set("cursor", "0");

        const res = await fetch(`/api/restaurants?${params.toString()}`);
        if (!res.ok) return;

        const data: RestaurantListResponse = await res.json();
        setRestaurants(data.restaurants);
        setNextCursor(data.nextCursor);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchFiltered();
  }, [category, sort, initialRestaurants, restaurants]);

  const loadMore = useCallback(async () => {
    if (loading || nextCursor === null) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (sort) params.set("sort", sort);
      params.set("cursor", String(nextCursor));

      const res = await fetch(`/api/restaurants?${params.toString()}`);
      if (!res.ok) return;

      const data: RestaurantListResponse = await res.json();
      setRestaurants((prev) => [...prev, ...data.restaurants]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [loading, nextCursor, category, sort]);

  // IntersectionObserver로 무한스크롤
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (initialLoading) {
    return (
      <section className="px-4 py-8">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="size-20 shrink-0 rounded-lg bg-muted" />
              <div className="flex flex-1 flex-col gap-2 py-1">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <h2 className="text-sm font-bold">주변 음식점</h2>
        <span className="text-xs text-muted-foreground">
          {restaurants.length}개
        </span>
      </div>

      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-16 text-muted-foreground">
          <MapPin className="size-10 stroke-1" />
          <p className="text-sm">주변에 음식점이 없어요</p>
          <p className="text-xs">배달 가능한 음식점이 없습니다.</p>
        </div>
      ) : (
        <>
          <div>
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>

          <div ref={sentinelRef} className="h-1" />

          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {nextCursor === null && restaurants.length > 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              모든 음식점을 확인했어요
            </p>
          )}
        </>
      )}
    </section>
  );
}
