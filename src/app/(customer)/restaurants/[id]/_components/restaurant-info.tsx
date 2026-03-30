import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import { FavoriteButton } from "./favorite-button";

interface RestaurantInfoProps {
  name: string;
  averageRating: number;
  reviewCount: number;
  restaurantId: string;
  isFavorited: boolean;
  isLoggedIn: boolean;
}

export function RestaurantInfo({
  name,
  averageRating,
  reviewCount,
  restaurantId,
  isFavorited,
  isLoggedIn,
}: RestaurantInfoProps) {
  return (
    <div className="pt-5 pb-1">
      {/* 배민클럽 배지 (장식용) */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="rounded bg-[#2DB400]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#2DB400]">
          배민클럽
        </span>
        <span className="text-xs text-muted-foreground">
          배달팁 무료
        </span>
      </div>

      {/* 가게명 + 찜 */}
      <div className="flex items-start justify-between">
        <h1 className="text-[20px] font-bold leading-tight">{name}</h1>
        <FavoriteButton
          restaurantId={restaurantId}
          isFavorited={isFavorited}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* 별점 + 가게정보 */}
      <div className="mt-2 flex items-center justify-between">
        <Link
          href={`/restaurants/${restaurantId}/reviews`}
          className="flex items-center gap-1"
        >
          <Star className="size-4 fill-[#FFB300] text-[#FFB300]" />
          <span className="text-sm font-bold">
            {averageRating > 0 ? averageRating.toFixed(1) : "-"}
          </span>
          {reviewCount > 0 && (
            <span className="text-sm text-muted-foreground">({reviewCount})</span>
          )}
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </Link>
        <button className="text-xs text-muted-foreground underline underline-offset-2">
          가게정보·원산지
        </button>
      </div>
    </div>
  );
}
