"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "../actions";

interface FavoriteButtonProps {
  restaurantId: string;
  isFavorited: boolean;
  isLoggedIn: boolean;
}

export function FavoriteButton({
  restaurantId,
  isFavorited: initialFavorited,
  isLoggedIn,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // Optimistic update
    setIsFavorited((prev) => !prev);

    startTransition(async () => {
      try {
        const result = await toggleFavorite(restaurantId);
        setIsFavorited(result.isFavorited);
      } catch {
        // Revert on error
        setIsFavorited(initialFavorited);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="p-1"
      aria-label={isFavorited ? "찜 해제" : "찜하기"}
    >
      <Heart
        className={cn(
          "size-6 transition-colors",
          isFavorited
            ? "fill-red-500 text-red-500"
            : "fill-none text-muted-foreground"
        )}
      />
    </button>
  );
}
