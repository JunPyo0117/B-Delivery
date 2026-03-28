"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "../api/toggleFavorite";

interface FavoriteButtonProps {
  restaurantId: string;
  initialFavorite?: boolean;
  className?: string;
}

export function FavoriteButton({
  restaurantId,
  initialFavorite = false,
  className,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function handleToggle(e: React.MouseEvent) {
    // 부모 링크 클릭 방지
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    const prevState = isFavorite;
    setIsFavorite(!isFavorite);

    startTransition(async () => {
      try {
        const result = await toggleFavorite({ restaurantId });
        setIsFavorite(result.isFavorite);
      } catch {
        // 실패 시 롤백
        setIsFavorite(prevState);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "p-1.5 rounded-full transition-colors",
        "hover:bg-accent disabled:opacity-50",
        className
      )}
      aria-label={isFavorite ? "찜 해제" : "찜하기"}
    >
      <Heart
        size={22}
        className={cn(
          "transition-colors",
          isFavorite
            ? "fill-red-500 text-red-500"
            : "fill-none text-muted-foreground"
        )}
      />
    </button>
  );
}
