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
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="text-sm font-medium">
          최근 리뷰 {totalCount.toLocaleString()}개
        </span>
        <div className="flex-1" />
        <button
          className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            false
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          최신순
          <ChevronDown className="size-3" />
        </button>
        <button
          onClick={handlePhotoToggle}
          className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            photoOnly
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          <Camera className="size-3" />
          사진 리뷰만 보기
        </button>
      </div>

      {/* 리뷰 목록 */}
      <div className={isPending ? "pointer-events-none opacity-50" : ""}>
        {reviews.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
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
            className="w-full"
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
