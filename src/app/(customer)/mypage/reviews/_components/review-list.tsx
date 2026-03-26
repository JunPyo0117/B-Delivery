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
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Star className="size-7 text-gray-300" />
        </div>
        <p className="text-[15px] font-medium text-gray-900">
          작성한 리뷰가 없습니다
        </p>
        <p className="text-[13px] text-gray-500 mt-1">
          주문 완료 후 리뷰를 남겨보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
