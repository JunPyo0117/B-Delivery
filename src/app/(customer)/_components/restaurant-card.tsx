import Image from "next/image";
import Link from "next/link";
import { Star, Clock, MapPin } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { RestaurantListItem } from "@/types/restaurant";

interface RestaurantCardProps {
  restaurant: RestaurantListItem;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const {
    id,
    name,
    category,
    imageUrl,
    minOrderAmount,
    deliveryFee,
    deliveryTime,
    distance,
    avgRating,
    reviewCount,
  } = restaurant;

  const categoryLabel =
    CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;

  return (
    <Link
      href={`/restaurants/${id}`}
      className="flex gap-3 border-b px-4 py-3 transition-colors active:bg-muted"
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-2xl">
            🍽️
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-bold">{name}</h3>
          <span className="shrink-0 text-xs text-muted-foreground">
            {categoryLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {avgRating > 0 && (
            <span className="flex items-center gap-0.5 font-medium">
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              {avgRating.toFixed(1)}
            </span>
          )}
          {reviewCount > 0 && (
            <span className="text-muted-foreground">
              리뷰 {reviewCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Clock className="size-3" />
            {deliveryTime}분
          </span>
          <span className="flex items-center gap-0.5">
            <MapPin className="size-3" />
            {distance}km
          </span>
          <span>배달비 {deliveryFee.toLocaleString()}원</span>
        </div>

        <p className="text-[11px] text-muted-foreground">
          최소주문 {minOrderAmount.toLocaleString()}원
        </p>
      </div>
    </Link>
  );
}
