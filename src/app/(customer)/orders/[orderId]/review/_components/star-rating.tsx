"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "size-5",
  md: "size-8",
  lg: "size-10",
};

export function StarRating({ value, onChange, size = "lg" }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            className="transition-transform hover:scale-110 active:scale-95"
            aria-label={`${starValue}점`}
          >
            <Star
              className={cn(
                sizeMap[size],
                "transition-colors",
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
