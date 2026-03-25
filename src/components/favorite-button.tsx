"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/app/(customer)/favorites/actions";

interface FavoriteButtonProps {
  restaurantId: string;
  initialFavorited: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function FavoriteButton({
  restaurantId,
  initialFavorited,
  size = "sm",
  className,
}: FavoriteButtonProps) {
  const [optimisticFavorited, setOptimisticFavorited] =
    useOptimistic(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      setOptimisticFavorited(!optimisticFavorited);
      await toggleFavorite(restaurantId);
    });
  }

  const iconSize = size === "sm" ? "size-5" : "size-6";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={optimisticFavorited ? "찜 해제" : "찜하기"}
      className={cn(
        "flex items-center justify-center transition-colors",
        isPending && "opacity-50",
        className
      )}
    >
      <Heart
        className={cn(
          iconSize,
          optimisticFavorited
            ? "fill-red-500 text-red-500"
            : "fill-none text-gray-400"
        )}
      />
    </button>
  );
}
