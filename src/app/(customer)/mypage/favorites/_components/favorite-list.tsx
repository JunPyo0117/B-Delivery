"use client";

import { Heart } from "lucide-react";
import { FavoriteRestaurantCard } from "./favorite-restaurant-card";
import type { FavoriteRestaurantItem } from "@/types/restaurant";

interface FavoriteListProps {
  restaurants: FavoriteRestaurantItem[];
}

export function FavoriteList({ restaurants }: FavoriteListProps) {
  if (restaurants.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Heart className="size-7 text-gray-300" />
        </div>
        <p className="text-[15px] font-medium text-gray-900">
          찜한 음식점이 없습니다
        </p>
        <p className="text-[13px] text-gray-500 mt-1">
          마음에 드는 음식점을 찜해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {restaurants.map((restaurant) => (
        <FavoriteRestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
