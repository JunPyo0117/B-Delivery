"use client";

import { Star } from "lucide-react";
import { ReviewCard } from "./review-card";

export interface ReviewItem {
  id: string;
  rating: number;
  content: string | null;
  tags: string[];
  imageUrls: string[];
  createdAt: string;
  restaurant: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

interface ReviewListProps {
  reviews: ReviewItem[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Star className="size-12 mb-3" />
        <p className="text-sm">작성한 리뷰가 없습니다</p>
        <p className="text-xs mt-1">주문 완료 후 리뷰를 남겨보세요!</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
