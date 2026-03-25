"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Pencil, Trash2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      <div className="px-4 py-4">
        {/* 음식점 정보 */}
        <Link
          href={`/restaurants/${review.restaurant.id}`}
          className="flex items-center gap-2 mb-3"
        >
          <div className="relative size-8 rounded-full overflow-hidden bg-muted shrink-0">
            {review.restaurant.imageUrl ? (
              <Image
                src={review.restaurant.imageUrl}
                alt={review.restaurant.name}
                fill
                className="object-cover"
                sizes="32px"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-muted-foreground text-[10px]">
                {review.restaurant.name.charAt(0)}
              </div>
            )}
          </div>
          <span className="font-semibold text-sm">
            {review.restaurant.name}
          </span>
        </Link>

        {/* 별점 + 날짜 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-4 ${
                  i < review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>

        {/* 태그 */}
        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {review.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 리뷰 내용 */}
        {review.content && (
          <p className="text-sm leading-relaxed mb-2">{review.content}</p>
        )}

        {/* 리뷰 이미지 */}
        {review.imageUrls.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto mb-3">
            {review.imageUrls.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`리뷰 이미지 ${i + 1}`}
                className="size-20 shrink-0 rounded-md object-cover"
              />
            ))}
          </div>
        )}

        {/* 수정/삭제 버튼 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={isDeleting}
          >
            <Pencil className="size-3.5 mr-1" />
            수정
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <Trash2 className="size-3.5 text-destructive mr-1" />
            )}
            삭제
          </Button>
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
