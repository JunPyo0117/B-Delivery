import { Star } from "lucide-react";
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
    <div className="pt-4">
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-bold">{name}</h1>
        <FavoriteButton
          restaurantId={restaurantId}
          isFavorited={isFavorited}
          isLoggedIn={isLoggedIn}
        />
      </div>

      <div className="mt-1 flex items-center gap-1">
        <Star className="size-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-semibold">
          {averageRating > 0 ? averageRating.toFixed(1) : "-"}
        </span>
        {reviewCount > 0 && (
          <span className="text-sm text-muted-foreground">({reviewCount})</span>
        )}
        <span className="ml-2 text-xs text-muted-foreground">
          가게정보·원산지
        </span>
      </div>
    </div>
  );
}
