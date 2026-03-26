"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Loader2 } from "lucide-react";

import { deleteReview } from "../actions";
import { ReviewEditDialog } from "./review-edit-dialog";
import type { ReviewItem } from "./review-list";

interface ReviewCardProps {
  review: ReviewItem;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  function handleDelete() {
    if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;

    startDeleteTransition(async () => {
      await deleteReview(review.id);
    });
  }

  const formattedDate = new Date(review.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="px-4 py-5">
        {/* 음식점 이름 + 날짜 */}
        <div className="flex items-center justify-between mb-2.5">
          <Link
            href={`/restaurants/${review.restaurant.id}`}
            className="flex items-center gap-2"
          >
            <div className="relative size-7 rounded-full overflow-hidden bg-gray-100 shrink-0">
              {review.restaurant.imageUrl ? (
                <Image
                  src={review.restaurant.imageUrl}
                  alt={review.restaurant.name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-gray-400 text-[10px] font-medium">
                  {review.restaurant.name.charAt(0)}
                </div>
              )}
            </div>
            <span className="font-bold text-[15px] text-gray-900">
              {review.restaurant.name}
            </span>
          </Link>
          <span className="text-[12px] text-gray-400">{formattedDate}</span>
        </div>

        {/* 별점 */}
        <div className="flex items-center gap-0.5 mb-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-[15px] ${
                i < review.rating
                  ? "fill-[#FFB300] text-[#FFB300]"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
        </div>

        {/* 리뷰 내용 */}
        {review.content && (
          <p className="text-[14px] text-gray-700 leading-relaxed mb-2.5">
            {review.content}
          </p>
        )}

        {/* 태그 */}
        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-[12px] text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 리뷰 이미지 */}
        {review.imageUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mb-3 scrollbar-hide">
            {review.imageUrls.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`리뷰 이미지 ${i + 1}`}
                className="size-20 shrink-0 rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {/* 수정/삭제 링크 */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={isDeleting}
            className="text-[13px] font-medium text-[#2DB400] hover:text-[#269900] disabled:text-gray-300 transition-colors"
          >
            수정
          </button>
          <span className="text-gray-200">|</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-[13px] font-medium text-[#FF5252] hover:text-red-600 disabled:text-gray-300 transition-colors"
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin inline" />
            ) : (
              "삭제"
            )}
          </button>
        </div>
      </div>

      {/* 수정 다이얼로그 */}
      <ReviewEditDialog
        review={review}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
