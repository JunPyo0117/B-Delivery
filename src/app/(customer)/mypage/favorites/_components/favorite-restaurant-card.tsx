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
      className="flex gap-3 px-4 py-4 relative hover:bg-gray-50/50 transition-colors"
    >
      {/* 썸네일 */}
      <div className="relative size-[72px] rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {restaurant.imageUrl ? (
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            fill
            className="object-cover"
            sizes="72px"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-gray-400 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className="font-bold text-[15px] text-gray-900 truncate pr-8">
          {restaurant.name}
        </h3>

        {hasRating && (
          <div className="flex items-center gap-0.5 mt-1">
            <Star className="size-3.5 fill-[#FFB300] text-[#FFB300]" />
            <span className="text-[13px] font-semibold text-gray-900">
              {restaurant.avgRating.toFixed(1)}
            </span>
            <span className="text-[12px] text-gray-400 ml-0.5">
              ({restaurant.reviewCount})
            </span>
          </div>
        )}

        {restaurant.menuSummary.length > 0 && (
          <p className="text-[12px] text-gray-500 mt-0.5 truncate">
            {restaurant.menuSummary.join(", ")}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[12px] text-gray-500">
            최소주문 {formattedMinOrder}원
          </span>
          {restaurant.isOpen ? (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#2DB400]/10 text-[#2DB400] font-medium">
              배달가능
            </span>
          ) : (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
              준비중
            </span>
          )}
        </div>
      </div>

      {/* 찜 버튼 */}
      <FavoriteButton
        restaurantId={restaurant.id}
        initialFavorited={true}
        size="sm"
        className="absolute top-4 right-4"
      />
    </Link>
  );
}
