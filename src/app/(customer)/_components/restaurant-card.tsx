import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { RestaurantListItem } from "@/types/restaurant";

interface RestaurantCardProps {
  restaurant: RestaurantListItem;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const {
    id,
    name,
    imageUrl,
    minOrderAmount,
    deliveryFee,
    deliveryTime,
    avgRating,
    reviewCount,
  } = restaurant;

  return (
    <Link
      href={`/restaurants/${id}`}
      className="flex gap-3.5 px-4 py-3.5 transition-colors active:bg-gray-50"
    >
      {/* 썸네일 100x100 */}
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
        <h3 className="text-[15px] font-semibold text-black truncate">{name}</h3>

        {/* 별점 */}
        <div className="flex items-center gap-1 mt-0.5">
          <Star className="size-3.5 fill-[#FFB300] text-[#FFB300]" />
          <span className="text-[13px] font-medium text-black">
            {avgRating > 0 ? avgRating.toFixed(1) : "-"}
          </span>
          {reviewCount > 0 && (
            <span className="text-[13px] text-gray-400">
              ({reviewCount})
            </span>
          )}
        </div>

        {/* 배달 시간 + 배달비 */}
        <p className="text-[13px] text-gray-500 mt-0.5">
          {deliveryTime}분 · 배달비 {deliveryFee.toLocaleString()}원
        </p>

        {/* 최소주문 */}
        <p className="text-[12px] text-gray-400">
          최소주문 {minOrderAmount.toLocaleString()}원
        </p>
      </div>
    </Link>
  );
}
