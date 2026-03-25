"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
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
      className="flex gap-3 px-4 py-3 relative"
    >
      {/* 썸네일 */}
      <div className="relative size-16 rounded-md overflow-hidden bg-muted shrink-0">
        {restaurant.imageUrl ? (
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-muted-foreground text-xs">
            No Image
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm truncate pr-8">
            {restaurant.name}
          </h3>
        </div>

        {hasRating && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">
              {restaurant.avgRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({restaurant.reviewCount})
            </span>
          </div>
        )}

        {restaurant.menuSummary.length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {restaurant.menuSummary.join(", ")}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-0.5">
          최소주문 {formattedMinOrder}원
        </p>

        {/* 태그 */}
        <div className="flex items-center gap-1.5 mt-1">
          {restaurant.isOpen ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-medium">
              배달가능
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-muted-foreground">
              지금 주소로는 배달이 어려워요
            </span>
          )}
        </div>
      </div>

      {/* 찜 버튼 (우상단) */}
      <FavoriteButton
        restaurantId={restaurant.id}
        initialFavorited={true}
        size="sm"
        className="absolute top-3 right-4"
      />
    </Link>
  );
}
