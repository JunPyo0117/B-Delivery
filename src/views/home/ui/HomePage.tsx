"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronDown,
  Star,
  Loader2,
  MapPin,
  ShoppingCart,
} from "lucide-react"

import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  SORT_OPTIONS,
  type SortOption,
} from "@/shared/config/constants"
import { SearchBar, SearchResultCard, useSearch } from "@/features/search"
import type { SearchResultItem } from "@/features/search/api/searchRestaurants"
import { FavoriteButton } from "@/features/favorite"
import { getRestaurants } from "@/entities/restaurant/api/getRestaurants"
import type {
  RestaurantCardData,
  GetRestaurantsResult,
  GetRestaurantsParams,
} from "@/entities/restaurant"
import { formatPrice, formatDistance, formatDeliveryTime } from "@/shared/lib"
import { cn } from "@/shared/lib"

// ────────────────────────────────────────────
// Sort 매핑: UI SortOption -> API sortBy
// ────────────────────────────────────────────

function toApiSortBy(
  uiSort: SortOption,
): GetRestaurantsParams["sortBy"] {
  switch (uiSort) {
    case "distance":
      return "distance"
    case "rating":
      return "rating"
    case "minOrder":
      return "minOrder"
    default:
      return "distance"
  }
}

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface HomePageProps {
  address: string | null
  latitude: number | null
  longitude: number | null
}

// ────────────────────────────────────────────
// 카테고리 파스텔 배경
// ────────────────────────────────────────────

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
  JJAMBBONG: "bg-teal-50",
  RICE_BOWL: "bg-indigo-50",
  ETC: "bg-slate-50",
}

// ────────────────────────────────────────────
// Skeleton (로딩)
// ────────────────────────────────────────────

function RestaurantSkeleton() {
  return (
    <div className="flex gap-3.5 px-4 py-3.5 animate-pulse">
      <div className="w-[100px] h-[100px] shrink-0 rounded-lg bg-gray-100" />
      <div className="flex flex-1 flex-col gap-2.5 py-2">
        <div className="h-4 w-3/5 rounded bg-gray-100" />
        <div className="h-3.5 w-1/4 rounded bg-gray-100" />
        <div className="h-3 w-2/5 rounded bg-gray-100" />
        <div className="h-3 w-1/3 rounded bg-gray-100" />
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// RestaurantCardItem
// ────────────────────────────────────────────

function RestaurantCardItem({ restaurant }: { restaurant: RestaurantCardData }) {
  const {
    id,
    name,
    imageUrl,
    rating,
    reviewCount,
    deliveryTime,
    deliveryFee,
    minOrderAmount,
    distance,
  } = restaurant

  return (
    <div className="relative">
      <Link
        href={`/restaurants/${id}`}
        className="flex gap-3.5 px-4 py-3.5 transition-colors active:bg-gray-50"
      >
        {/* 썸네일 */}
        <div className="relative w-[100px] h-[100px] shrink-0 overflow-hidden rounded-lg bg-[#F2F2F2]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="100px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-3xl">
              🍽️
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <h3 className="text-[15px] font-semibold text-black truncate">
            {name}
          </h3>

          {/* 별점 */}
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="size-3.5 fill-[#FFB300] text-[#FFB300]" />
            <span className="text-[13px] font-medium text-black">
              {rating > 0 ? rating.toFixed(1) : "-"}
            </span>
            {reviewCount > 0 && (
              <span className="text-[13px] text-gray-400">
                ({reviewCount})
              </span>
            )}
          </div>

          {/* 배달 시간 + 배달비 */}
          <p className="text-[13px] text-gray-500 mt-0.5">
            {distance !== undefined && `${formatDistance(distance)} · `}
            {formatDeliveryTime(deliveryTime)} · 배달비{" "}
            {deliveryFee > 0 ? formatPrice(deliveryFee) : "무료"}
          </p>

          {/* 최소주문 */}
          <p className="text-[12px] text-gray-400">
            최소주문 {formatPrice(minOrderAmount)}
          </p>
        </div>
      </Link>

      {/* FavoriteButton: 카드 우측 상단 */}
      <div className="absolute top-3.5 right-4">
        <FavoriteButton restaurantId={id} className="bg-white/80 backdrop-blur-sm" />
      </div>
    </div>
  )
}

// ────────────────────────────────────────────
// HomePage
// ────────────────────────────────────────────

export function HomePage({ address, latitude, longitude }: HomePageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터
  const activeCategory = searchParams.get("category")
  const activeSort = (searchParams.get("sort") as SortOption) ?? "distance"

  // 음식점 목록 상태
  const [restaurants, setRestaurants] = useState<RestaurantCardData[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // 무한 스크롤 sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)

  // 검색 훅
  const search = useSearch({
    lat: latitude ?? 0,
    lng: longitude ?? 0,
  })

  const isSearchMode = search.query.trim().length > 0

  // ── 초기 로드 & 필터 변경 시 음식점 목록 로드 ──
  const fetchRestaurants = useCallback(
    async (cursor?: string) => {
      if (!latitude || !longitude) return

      const isInitial = !cursor
      if (isInitial) setInitialLoading(true)
      else setLoading(true)

      try {
        const result: GetRestaurantsResult = await getRestaurants({
          lat: latitude,
          lng: longitude,
          category: activeCategory as RestaurantCardData["category"] | undefined,
          sortBy: toApiSortBy(activeSort),
          cursor: cursor ?? undefined,
        })

        if (isInitial) {
          setRestaurants(result.restaurants)
        } else {
          setRestaurants((prev) => [...prev, ...result.restaurants])
        }
        setNextCursor(result.nextCursor)
        setHasMore(result.hasMore)
      } finally {
        if (isInitial) setInitialLoading(false)
        else setLoading(false)
      }
    },
    [latitude, longitude, activeCategory, activeSort],
  )

  // 필터 변경 시 초기 로드
  useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  // 무한 스크롤 IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && nextCursor) {
          fetchRestaurants(nextCursor)
        }
      },
      { rootMargin: "200px" },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, nextCursor, fetchRestaurants])

  // ── 카테고리 클릭 ──
  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (activeCategory === category) {
      params.delete("category")
    } else {
      params.set("category", category)
    }
    router.push(`/?${params.toString()}`)
  }

  // ── 정렬 변경 ──
  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (sort === "distance") {
      params.delete("sort")
    } else {
      params.set("sort", sort)
    }
    router.push(`/?${params.toString()}`)
  }

  // ── 주소 표시 ──
  const displayAddress = address
    ? address.length > 15
      ? address.slice(0, 15) + "..."
      : address
    : "우리집"

  const categories = Object.entries(CATEGORY_LABELS) as [string, string][]

  return (
    <div className="flex flex-col min-h-dvh bg-[#F8F8F8]">
      {/* ── 헤더: 주소 표시 ── */}
      <header className="sticky top-0 z-40 bg-white px-4 pt-3 pb-1">
        <div className="flex items-center justify-between">
          <Link
            href="/mypage/addresses"
            className="flex items-center gap-0.5 text-black"
          >
            <span className="text-[15px] font-bold">{displayAddress}</span>
            <ChevronDown className="size-4 text-gray-600" />
          </Link>
          <Link
            href="/cart"
            className="relative p-2 -mr-2 text-gray-700 hover:text-black transition-colors"
          >
            <ShoppingCart className="size-5" />
          </Link>
        </div>
      </header>

      {/* ── 검색바 ── */}
      <div className="px-4 pt-2 pb-3 bg-white">
        <SearchBar
          value={search.query}
          onChange={search.setQuery}
          onClear={search.clearSearch}
          isLoading={search.isLoading}
        />
      </div>

      {/* ── 검색 결과 모드 ── */}
      {isSearchMode ? (
        <div className="bg-white flex-1">
          {search.isLoading && search.results.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400">검색 중...</span>
            </div>
          ) : search.results.length === 0 && !search.isLoading ? (
            <div className="py-16 text-center text-sm text-gray-400">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {search.results.map((item: SearchResultItem) => (
                <SearchResultCard
                  key={item.id}
                  item={item}
                  query={search.query}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── 카테고리 가로 스크롤 ── */}
          <div className="bg-white">
            <section className="px-4 pt-2 pb-4">
              <h2 className="text-[15px] font-bold text-black mb-3">
                음식배달
              </h2>
              <div className="flex overflow-x-auto gap-x-3 gap-y-4 scrollbar-hide pb-1 flex-wrap">
                {categories.map(([key, label]) => {
                  const icon =
                    CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS]
                  const isActive = activeCategory === key
                  const bgColor = CATEGORY_BG[key] ?? "bg-gray-50"

                  return (
                    <button
                      key={key}
                      onClick={() => handleCategoryClick(key)}
                      className="flex flex-col items-center gap-1.5 w-[calc(20%-0.6rem)]"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center size-12 rounded-full transition-all",
                          bgColor,
                          isActive && "ring-2 ring-[#2DB400] ring-offset-1",
                        )}
                      >
                        <span className="text-[22px]">{icon}</span>
                      </div>
                      <span
                        className={cn(
                          "text-[11px] leading-tight text-center",
                          isActive
                            ? "font-bold text-[#2DB400]"
                            : "text-gray-600",
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          {/* 구분선 */}
          <div className="h-2 bg-[#F2F2F2]" />

          {/* ── 정렬 칩 ── */}
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-white scrollbar-hide">
            {Object.entries(SORT_OPTIONS).map(([value, label]) => {
              const isActive = activeSort === value
              return (
                <button
                  key={value}
                  onClick={() => handleSortChange(value as SortOption)}
                  className={cn(
                    "flex shrink-0 items-center gap-0.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                    isActive
                      ? "border-black bg-black font-semibold text-white"
                      : "border-[#EEEEEE] bg-white text-gray-500 hover:bg-gray-50",
                  )}
                >
                  {label}
                  <ChevronDown
                    className={cn(
                      "size-3.5",
                      isActive ? "text-white" : "text-gray-400",
                    )}
                  />
                </button>
              )
            })}
          </div>

          {/* ── 음식점 리스트 ── */}
          <section className="bg-white flex-1">
            {initialLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <RestaurantSkeleton key={i} />
                ))}
              </div>
            ) : restaurants.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-16 text-gray-400">
                <MapPin className="size-10 stroke-1" />
                <p className="text-sm">주변에 음식점이 없어요</p>
                <p className="text-xs">배달 가능한 음식점이 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-[#EEEEEE]">
                  {restaurants.map((restaurant) => (
                    <RestaurantCardItem
                      key={restaurant.id}
                      restaurant={restaurant}
                    />
                  ))}
                </div>

                {/* IntersectionObserver sentinel */}
                <div ref={sentinelRef} className="h-1" />

                {loading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="size-5 animate-spin text-gray-400" />
                  </div>
                )}

                {!hasMore && restaurants.length > 0 && (
                  <p className="py-6 text-center text-xs text-gray-400">
                    모든 음식점을 확인했어요
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  )
}
