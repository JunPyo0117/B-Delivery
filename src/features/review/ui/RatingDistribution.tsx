"use client"

import type { ReviewStats } from "@/entities/review"
import { cn } from "@/shared/lib"

interface RatingDistributionProps {
  stats: ReviewStats
  className?: string
}

const RATING_LABELS = [5, 4, 3, 2, 1] as const

/**
 * 1~5점 별점 분포 막대 그래프
 * - 왼쪽: 별 숫자, 가운데: 프로그레스 바, 오른쪽: 리뷰 개수
 */
export function RatingDistribution({ stats, className }: RatingDistributionProps) {
  const maxCount = Math.max(
    ...Object.values(stats.distribution),
    1 // 0으로 나누기 방지
  )

  return (
    <div className={cn("space-y-1.5", className)}>
      {RATING_LABELS.map((rating) => {
        const count = stats.distribution[rating]
        const percentage = (count / maxCount) * 100

        return (
          <div key={rating} className="flex items-center gap-2">
            {/* 별점 숫자 */}
            <span className="w-4 text-right text-xs font-medium text-gray-600 dark:text-gray-400">
              {rating}
            </span>
            <span className="text-xs text-yellow-400">★</span>

            {/* 막대 그래프 */}
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-yellow-400 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* 개수 */}
            <span className="w-8 text-right text-xs text-gray-500 dark:text-gray-400">
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
