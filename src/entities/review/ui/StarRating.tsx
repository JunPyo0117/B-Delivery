"use client"

import { useState, useCallback } from "react"
import { cn } from "@/shared/lib/utils"

interface StarRatingProps {
  /** 현재 별점 (1~5) */
  value: number
  /** 입력 모드일 때 변경 콜백 */
  onChange?: (rating: number) => void
  /** 읽기 전용 모드 (기본: true) */
  readOnly?: boolean
  /** 별 크기 (tailwind text-* 클래스) */
  size?: "sm" | "md" | "lg"
  /** 평균 점수 텍스트 표시 여부 */
  showValue?: boolean
  className?: string
}

const SIZE_MAP = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
} as const

export function StarRating({
  value,
  onChange,
  readOnly = true,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const isInteractive = !readOnly && !!onChange

  const handleClick = useCallback(
    (star: number) => {
      if (isInteractive) {
        onChange(star)
      }
    },
    [isInteractive, onChange]
  )

  const handleMouseEnter = useCallback(
    (star: number) => {
      if (isInteractive) {
        setHoverRating(star)
      }
    },
    [isInteractive]
  )

  const handleMouseLeave = useCallback(() => {
    if (isInteractive) {
      setHoverRating(0)
    }
  }, [isInteractive])

  const displayRating = hoverRating || value

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          className={cn(
            SIZE_MAP[size],
            "transition-colors",
            isInteractive
              ? "cursor-pointer hover:scale-110 active:scale-95"
              : "cursor-default",
            star <= displayRating
              ? "text-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          )}
          aria-label={`${star}점`}
        >
          ★
        </button>
      ))}
      {showValue && (
        <span
          className={cn(
            "ml-1 font-semibold text-gray-900 dark:text-gray-100",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-xl"
          )}
        >
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
