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
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Heart className="size-12 mb-3" />
        <p className="text-sm">찜한 음식점이 없습니다</p>
        <p className="text-xs mt-1">마음에 드는 음식점을 찜해보세요!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#EEEEEE]">
      {restaurants.map((restaurant) => (
        <FavoriteRestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
