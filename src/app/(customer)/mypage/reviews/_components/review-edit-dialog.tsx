"use client";

import { useState, useTransition } from "react";
import { Star, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateReview } from "../actions";
import type { ReviewItem } from "./review-list";

const REVIEW_TAGS = [
  "맛이 좋아요",
  "양이 많아요",
  "배달이 빨라요",
  "포장이 깔끔해요",
  "가성비가 좋아요",
  "재주문 의사 있어요",
] as const;

interface ReviewEditDialogProps {
  review: ReviewItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewEditDialog({
  review,
  open,
  onOpenChange,
}: ReviewEditDialogProps) {
  const [rating, setRating] = useState(review.rating);
  const [content, setContent] = useState(review.content ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(review.tags);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const result = await updateReview({
        reviewId: review.id,
        rating,
        content: content || undefined,
        tags: selectedTags,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>리뷰 수정</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* 별점 */}
          <div>
            <p className="text-sm font-medium mb-2">별점</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i + 1)}
                  className="p-0.5"
                  aria-label={`${i + 1}점`}
                >
                  <Star
                    className={`size-7 ${
                      i < rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted text-muted"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 태그 */}
          <div>
            <p className="text-sm font-medium mb-2">어떤 점이 좋았나요?</p>
            <div className="flex flex-wrap gap-2">
              {REVIEW_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 내용 */}
          <div>
            <p className="text-sm font-medium mb-2">리뷰 내용</p>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="솔직한 리뷰를 남겨주세요"
              rows={4}
            />
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || rating === 0}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-1" />
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
