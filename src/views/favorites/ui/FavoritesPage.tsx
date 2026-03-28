import { Search, ShoppingCart, Heart } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import type { FavoriteRestaurantItem } from "@/types/restaurant"

interface FavoritesPageProps {
  restaurants: FavoriteRestaurantItem[]
}

/**
 * 찜 목록 페이지 (FSD pages 레이어)
 * - 찜한 음식점 목록
 * - 배달/픽업 | 장보기/쇼핑 탭
 * - 빈 상태: "관심 음식점이 없습니다"
 */
export function FavoritesPage({ restaurants }: FavoritesPageProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white">
        <div className="flex items-center justify-between px-4 h-[52px]">
          <h1 className="text-lg font-bold text-black">찜</h1>
          <div className="flex items-center gap-4">
            <button type="button" aria-label="검색" className="text-gray-700">
              <Search className="size-[22px]" />
            </button>
            <Link href="/cart" className="text-gray-700" aria-label="장바구니">
              <ShoppingCart className="size-[22px]" />
            </Link>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-[#EEEEEE]">
          <button
            type="button"
            className="flex-1 py-3 text-[14px] font-bold text-black border-b-2 border-black text-center"
          >
            배달/픽업
          </button>
          <button
            type="button"
            disabled
            className="flex-1 py-3 text-[14px] text-gray-400 text-center"
          >
            장보기/쇼핑
          </button>
        </div>
      </header>

      {/* 카운트 */}
      <p className="px-4 py-3 text-[13px] text-gray-500">
        총 {restaurants.length}개
      </p>

      {/* 목록 */}
      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Heart className="size-12 mb-3" />
          <p className="text-sm">관심 음식점이 없습니다</p>
          <p className="text-xs mt-1">마음에 드는 음식점을 찜해보세요!</p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEEEEE]">
          {restaurants.map((restaurant) => (
            <FavoriteRestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  )
}

/** 찜한 음식점 카드 */
function FavoriteRestaurantCard({
  restaurant,
}: {
  restaurant: FavoriteRestaurantItem
}) {
  const formattedMinOrder = restaurant.minOrderAmount.toLocaleString()
  const hasRating = restaurant.reviewCount > 0

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="flex gap-3.5 px-4 py-3.5 relative transition-colors active:bg-gray-50"
    >
      {/* 썸네일 90x90 */}
      <div className="relative w-[90px] h-[90px] rounded-lg overflow-hidden bg-[#F2F2F2] shrink-0">
        {restaurant.imageUrl ? (
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            fill
            className="object-cover"
            sizes="90px"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-2xl">
            🍽
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* 딜리버리 뱃지 */}
        <div className="flex items-center gap-1.5 mb-1">
          {restaurant.isOpen ? (
            <span className="text-[11px] px-1.5 py-[1px] rounded bg-[#E8F5E9] text-[#2DB400] font-semibold">
              딜리버리
            </span>
          ) : (
            <span className="text-[11px] px-1.5 py-[1px] rounded bg-gray-100 text-gray-400 font-medium">
              배달불가
            </span>
          )}
        </div>

        {/* 가게 이름 */}
        <h3 className="font-semibold text-[15px] text-black truncate pr-8">
          {restaurant.name}
        </h3>

        {/* 별점 */}
        {hasRating && (
          <div className="flex items-center gap-0.5 mt-1">
            <Star className="size-3.5 fill-[#FFB300] text-[#FFB300]" />
            <span className="text-[13px] font-medium text-black">
              {restaurant.avgRating.toFixed(1)}
            </span>
            <span className="text-[13px] text-gray-400">
              ({restaurant.reviewCount})
            </span>
          </div>
        )}

        {/* 메뉴 요약 */}
        {restaurant.menuSummary.length > 0 && (
          <p className="text-[12px] text-gray-500 mt-0.5 truncate">
            {restaurant.menuSummary.join(", ")}
          </p>
        )}

        {/* 최소주문 */}
        <p className="text-[12px] text-gray-400 mt-0.5">
          최소주문 {formattedMinOrder}원
        </p>
      </div>

      {/* 찜 하트 아이콘 (우상단) */}
      <Heart
        className="absolute top-3.5 right-4 size-5 fill-red-500 text-red-500"
      />
    </Link>
  )
}
