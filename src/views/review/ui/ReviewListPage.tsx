"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingCart, Star, Camera, ChevronDown, Flag } from "lucide-react"
import { useCartStore } from "@/features/cart/model/cartStore"
import { Button } from "@/shared/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"

export interface ReviewItem {
  id: string
  rating: number
  content: string | null
  tags: string[]
  imageUrls: string[]
  createdAt: string
  user: {
    nickname: string
    image: string | null
  }
  orderMenuNames: string[]
}

export interface ReviewStatsData {
  averageRating: number
  totalCount: number
  distribution: { rating: number; count: number }[]
}

interface ReviewListPageProps {
  restaurantId: string
  stats: ReviewStatsData
  initialReviews: ReviewItem[]
  initialNextCursor: string | null
  getReviews: (
    restaurantId: string,
    options?: { photoOnly?: boolean; cursor?: string }
  ) => Promise<{ reviews: ReviewItem[]; nextCursor: string | null }>
}

/**
 * 리뷰 목록 페이지 (FSD pages 레이어)
 * - 별점 분포 차트
 * - 사진 리뷰 필터
 * - 무한 로딩 (더보기)
 */
export function ReviewListPage({
  restaurantId,
  stats,
  initialReviews,
  initialNextCursor,
  getReviews,
}: ReviewListPageProps) {
  const router = useRouter()
  const totalQuantity = useCartStore((s) => s.getTotalQuantity())
  const [reviews, setReviews] = useState(initialReviews)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [photoOnly, setPhotoOnly] = useState(false)
  const [isPending, startTransition] = useTransition()

  const reload = useCallback(
    (newPhotoOnly: boolean) => {
      startTransition(async () => {
        const result = await getReviews(restaurantId, {
          photoOnly: newPhotoOnly,
        })
        setReviews(result.reviews)
        setNextCursor(result.nextCursor)
      })
    },
    [restaurantId, getReviews]
  )

  const handlePhotoToggle = () => {
    const next = !photoOnly
    setPhotoOnly(next)
    reload(next)
  }

  const loadMore = () => {
    if (!nextCursor) return
    startTransition(async () => {
      const result = await getReviews(restaurantId, {
        photoOnly,
        cursor: nextCursor,
      })
      setReviews((prev) => [...prev, ...result.reviews])
      setNextCursor(result.nextCursor)
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex h-12 items-center justify-between bg-white px-4">
        <button
          onClick={() => router.back()}
          className="flex size-9 items-center justify-center"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="size-5 text-gray-900" />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-gray-900">
          리뷰
        </h1>

        <button
          onClick={() => router.push("/cart")}
          className="relative flex size-9 items-center justify-center"
          aria-label="장바구니"
        >
          <ShoppingCart className="size-5 text-gray-900" />
          {totalQuantity > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#2DB400] text-[10px] font-bold text-white">
              {totalQuantity > 99 ? "99+" : totalQuantity}
            </span>
          )}
        </button>
      </div>

      {/* 별점 분포 */}
      <RatingDistributionView stats={stats} />

      <div className="h-2 bg-gray-100" />

      {/* 필터 바 */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-[14px] font-bold text-gray-900">
          최근 리뷰 {stats.totalCount.toLocaleString()}개
        </span>
        <div className="flex-1" />

        <button
          className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors"
        >
          <span className="text-[11px]">&#x2195;</span>
          최신순
          <ChevronDown className="size-3" />
        </button>

        <button
          onClick={handlePhotoToggle}
          className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            photoOnly
              ? "border-[#2DB400] bg-[#2DB400]/5 text-[#2DB400]"
              : "border-gray-200 bg-white text-gray-600"
          }`}
        >
          <Camera className="size-3" />
          사진 리뷰만 보기
        </button>
      </div>

      <div className="h-px bg-gray-100" />

      {/* 리뷰 목록 */}
      <div className={isPending ? "pointer-events-none opacity-50" : ""}>
        {reviews.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">
            {photoOnly
              ? "사진 리뷰가 없습니다"
              : "아직 리뷰가 없습니다"}
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCardView key={review.id} review={review} />
          ))
        )}
      </div>

      {/* 더보기 */}
      {nextCursor && (
        <div className="px-4 py-4">
          <Button
            variant="outline"
            className="w-full rounded-lg border-gray-200 text-sm font-medium text-gray-600"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending ? "불러오는 중..." : "더 보기"}
          </Button>
        </div>
      )}
    </div>
  )
}

/** 별점 분포 차트 */
function RatingDistributionView({ stats }: { stats: ReviewStatsData }) {
  const maxCount = Math.max(...stats.distribution.map((d) => d.count), 1)

  return (
    <div className="flex items-start gap-8 px-5 py-6">
      <div className="flex shrink-0 flex-col items-center">
        <span className="text-[36px] font-bold leading-none text-gray-900">
          {stats.averageRating.toFixed(1)}
        </span>
        <div className="mt-2 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-4 ${
                i < Math.round(stats.averageRating)
                  ? "fill-[#FFB300] text-[#FFB300]"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[6px]">
        {stats.distribution.map(({ rating, count }) => (
          <div key={rating} className="flex items-center gap-2">
            <span className="w-6 text-right text-xs font-medium text-gray-400">
              {rating}점
            </span>
            <div className="relative h-[10px] flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#FFB300] transition-all duration-300"
                style={{
                  width: `${stats.totalCount > 0 ? (count / maxCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="w-8 text-right text-xs tabular-nums text-gray-400">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 리뷰 카드 */
function ReviewCardView({ review }: { review: ReviewItem }) {
  const initial = review.user.nickname?.charAt(0) ?? "?"

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}.${m}.${d}`
  }

  return (
    <div className="border-b border-gray-100 px-4 py-4">
      <div className="flex items-center gap-2.5">
        <Avatar className="size-9 border border-gray-100">
          <AvatarImage src={review.user.image ?? undefined} />
          <AvatarFallback className="bg-gray-100 text-xs font-medium text-gray-500">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-900">
              {review.user.nickname}
            </span>
            <span className="text-[11px] text-gray-400">
              리뷰 {review.orderMenuNames.length > 0 ? review.orderMenuNames.length : 1}
              {" "} · 평균별점 {review.rating.toFixed(1)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <div className="flex items-center gap-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3 ${
                    i < review.rating
                      ? "fill-[#FFB300] text-[#FFB300]"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-gray-400">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {review.orderMenuNames.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {review.orderMenuNames.map((name, i) => (
            <span
              key={i}
              className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {review.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#2DB400]/10 px-2 py-0.5 text-[11px] font-medium text-[#2DB400]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {review.content && (
        <p className="mt-2.5 text-[14px] leading-[1.6] text-gray-800">
          {review.content}
        </p>
      )}

      {review.imageUrls.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.imageUrls.map((url, i) => (
            <img
              key={url}
              src={url}
              alt={`리뷰 이미지 ${i + 1}`}
              className="size-[120px] shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button className="flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-gray-600">
          <Flag className="size-3" />
          신고하기
        </button>
      </div>
    </div>
  )
}
