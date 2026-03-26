"use client";

import { useState, useTransition, useCallback } from "react";
import { Camera, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "./review-card";
import { getReviews, type ReviewItem } from "../actions";

interface ReviewListClientProps {
  restaurantId: string;
  initialReviews: ReviewItem[];
  initialNextCursor: string | null;
  totalCount: number;
}

export function ReviewListClient({
  restaurantId,
  initialReviews,
  initialNextCursor,
  totalCount,
}: ReviewListClientProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reload = useCallback(
    (newPhotoOnly: boolean) => {
      startTransition(async () => {
        const result = await getReviews(restaurantId, {
          photoOnly: newPhotoOnly,
        });
        setReviews(result.reviews);
        setNextCursor(result.nextCursor);
      });
    },
    [restaurantId]
  );

  const handlePhotoToggle = () => {
    const next = !photoOnly;
    setPhotoOnly(next);
    reload(next);
  };

  const loadMore = () => {
    if (!nextCursor) return;
    startTransition(async () => {
      const result = await getReviews(restaurantId, {
        photoOnly,
        cursor: nextCursor,
      });
      setReviews((prev) => [...prev, ...result.reviews]);
      setNextCursor(result.nextCursor);
    });
  };

  return (
    <div>
      {/* 필터 바 */}
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="text-[14px] font-bold text-gray-900">
          최근 리뷰 {totalCount.toLocaleString()}개
        </span>
        <div className="flex-1" />

        {/* 최신순 칩 */}
        <button
          className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors"
        >
          <span className="text-[11px]">&#x2195;</span>
          최신순
          <ChevronDown className="size-3" />
        </button>

        {/* 사진 리뷰만 보기 칩 */}
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
            <ReviewCard key={review.id} review={review} />
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
  );
}
