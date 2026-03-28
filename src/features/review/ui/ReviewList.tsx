"use client"

import { useState, useEffect, useRef, useCallback, useTransition } from "react"
import { StarRating, ReviewCard, getReviews } from "@/entities/review"
import type { ReviewCardData, ReviewStats } from "@/entities/review"
import { RatingDistribution } from "./RatingDistribution"
import { cn } from "@/shared/lib"

interface ReviewListProps {
  restaurantId: string
  /** 초기 데이터 (SSR) */
  initialReviews?: ReviewCardData[]
  initialStats?: ReviewStats
  initialCursor?: string | null
  className?: string
}

/**
 * 리뷰 목록
 * - 무한 스크롤 (IntersectionObserver)
 * - 상단: 평균 별점 + 분포 차트
 * - "사진 리뷰만" 토글
 * - ReviewCard 렌더링
 */
export function ReviewList({
  restaurantId,
  initialReviews = [],
  initialStats,
  initialCursor,
  className,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewCardData[]>(initialReviews)
  const [stats, setStats] = useState<ReviewStats | null>(initialStats ?? null)
  const [cursor, setCursor] = useState<string | null>(initialCursor ?? null)
  const [photoOnly, setPhotoOnly] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialCursor)
  const [isPending, startTransition] = useTransition()
  const observerRef = useRef<HTMLDivElement>(null)
  const isInitialLoad = useRef(!initialReviews.length)

  // 초기 로드 또는 필터 변경 시 데이터 가져오기
  const loadReviews = useCallback(
    (reset: boolean) => {
      startTransition(async () => {
        const result = await getReviews({
          restaurantId,
          photoOnly,
          cursor: reset ? undefined : cursor ?? undefined,
        })

        if (reset) {
          setReviews(result.reviews)
        } else {
          setReviews((prev) => [...prev, ...result.reviews])
        }

        setStats(result.stats)
        setCursor(result.nextCursor)
        setHasMore(!!result.nextCursor)
      })
    },
    [restaurantId, photoOnly, cursor]
  )

  // 초기 로드
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false
      loadReviews(true)
    }
  }, [loadReviews])

  // photoOnly 필터 변경 시 초기화
  useEffect(() => {
    setReviews([])
    setCursor(null)
    setHasMore(true)
    loadReviews(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoOnly])

  // 무한 스크롤
  useEffect(() => {
    const target = observerRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPending) {
          loadReviews(false)
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, isPending, loadReviews])

  return (
    <div className={cn("space-y-4", className)}>
      {/* 평균 별점 + 분포 */}
      {stats && (
        <div className="flex items-start gap-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          {/* 평균 별점 */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats.averageRating.toFixed(1)}
            </span>
            <StarRating value={Math.round(stats.averageRating)} size="sm" readOnly />
            <span className="text-xs text-gray-500">
              리뷰 {stats.totalCount.toLocaleString()}개
            </span>
          </div>

          {/* 분포 차트 */}
          <RatingDistribution stats={stats} className="flex-1" />
        </div>
      )}

      {/* 필터 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPhotoOnly(!photoOnly)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
            photoOnly
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
          )}
        >
          📷 사진 리뷰만
        </button>
      </div>

      {/* 리뷰 목록 */}
      {reviews.length === 0 && !isPending ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {photoOnly ? "사진 리뷰가 없습니다." : "아직 리뷰가 없습니다."}
        </div>
      ) : (
        <div>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* 무한 스크롤 트리거 */}
      <div ref={observerRef} className="h-4" />

      {/* 로딩 */}
      {isPending && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
        </div>
      )}
    </div>
  )
}
