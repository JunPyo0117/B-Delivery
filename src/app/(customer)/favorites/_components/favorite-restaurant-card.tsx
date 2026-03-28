"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { FavoriteButton } from "@/shared/ui/favorite-button";
import type { FavoriteRestaurantItem } from "@/types/restaurant";

interface FavoriteRestaurantCardProps {
  restaurant: FavoriteRestaurantItem;
}

export function FavoriteRestaurantCard({
  restaurant,
}: FavoriteRestaurantCardProps) {
  const formattedMinOrder = restaurant.minOrderAmount.toLocaleString();
  const hasRating = restaurant.reviewCount > 0;

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
            🍽️
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

      {/* 찜 버튼 (우상단) */}
      <FavoriteButton
        restaurantId={restaurant.id}
        initialFavorited={true}
        size="sm"
        className="absolute top-3.5 right-4"
      />
    </Link>
  );
}
