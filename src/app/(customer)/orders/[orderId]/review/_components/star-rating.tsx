"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "size-5",
  md: "size-8",
  lg: "size-9",
};

export function StarRating({ value, onChange, size = "lg" }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            className="transition-transform hover:scale-110 active:scale-95 p-0.5"
            aria-label={`${starValue}점`}
          >
            <Star
              className={`${sizeMap[size]} transition-colors`}
              style={
                filled
                  ? { fill: "#FFB300", color: "#FFB300" }
                  : { fill: "#e5e7eb", color: "#d1d5db" }
              }
            />
          </button>
        );
      })}
    </div>
  );
}
