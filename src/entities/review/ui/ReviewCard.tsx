"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import type { ReviewCardData } from "../model/types"
import { StarRating } from "./StarRating"

interface ReviewCardProps {
  review: ReviewCardData
  onReport?: (reviewId: string) => void
  className?: string
}

function formatDate(date: Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
}

export function ReviewCard({ review, onReport, className }: ReviewCardProps) {
  return (
    <div
      className={cn(
        "border-b py-4 last:border-b-0 dark:border-gray-800",
        className
      )}
    >
      {/* 유저 정보 + 별점 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {review.userImage ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image
                src={review.userImage}
                alt={review.userName}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {review.userName[0]}
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {review.userName}
            </span>
            <div className="flex items-center gap-2">
              <StarRating value={review.rating} size="sm" readOnly />
              <span className="text-xs text-gray-400">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {onReport && (
          <button
            onClick={() => onReport(review.id)}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            신고하기
          </button>
        )}
      </div>

      {/* 리뷰 내용 */}
      {review.content && (
        <p className="mb-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {review.content}
        </p>
      )}

      {/* 리뷰 이미지 */}
      {review.imageUrls.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {review.imageUrls.map((url, index) => (
            <div
              key={index}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg"
            >
              <Image
                src={url}
                alt={`리뷰 이미지 ${index + 1}`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          ))}
        </div>
      )}

      {/* 태그 뱃지 */}
      {review.tags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 사장님 답글 */}
      {review.ownerReply && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              사장님
            </span>
            {review.ownerRepliedAt && (
              <span className="text-xs text-gray-400">
                {formatDate(review.ownerRepliedAt)}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {review.ownerReply}
          </p>
        </div>
      )}
    </div>
  )
}
