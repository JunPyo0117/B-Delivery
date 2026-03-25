"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "./star-rating";
import { TagSelector } from "./tag-selector";
import { ImageUploader } from "./image-uploader";
import { createReview } from "../actions";

interface OrderInfo {
  orderId: string;
  restaurantName: string;
  restaurantId: string;
  menuSummary: string;
}

interface ReviewFormProps {
  order: OrderInfo;
}

export function ReviewForm({ order }: ReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) {
      setError("별점을 선택해주세요.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createReview({
        orderId: order.orderId,
        rating,
        content: content.trim() || undefined,
        tags: selectedTags,
        imageUrls,
      });

      if (result.success) {
        router.push(`/restaurants/${order.restaurantId}`);
        router.refresh();
      } else {
        setError(result.error || "리뷰 작성에 실패했습니다.");
      }
    });
  };

  const ratingLabels = ["", "별로예요", "그저 그래요", "보통이에요", "맛있어요", "최고예요"];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex h-12 items-center border-b bg-background px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="mr-3"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-semibold">리뷰 작성</h1>
      </header>

      <div className="flex-1 px-4 py-5">
        {/* 주문 정보 */}
        <div className="mb-5">
          <h2 className="text-lg font-bold">{order.restaurantName}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {order.menuSummary}
          </p>
        </div>

        <Separator className="mb-5" />

        {/* 별점 */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            음식은 어떠셨나요?
          </p>
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-sm font-semibold text-primary">
              {ratingLabels[rating]}
            </p>
          )}
        </div>

        <Separator className="mb-5" />

        {/* 태그 선택 */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium">이 음식점의 장점을 알려주세요</p>
          <TagSelector
            selectedTags={selectedTags}
            onToggle={handleTagToggle}
          />
        </div>

        <Separator className="mb-5" />

        {/* 텍스트 리뷰 */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium">리뷰를 작성해주세요 (선택)</p>
          <Textarea
            placeholder="다른 고객들에게 도움이 되는 리뷰를 남겨주세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={4}
            className="resize-none"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {content.length}/500
          </p>
        </div>

        {/* 이미지 업로드 */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium">사진 첨부 (선택)</p>
          <ImageUploader
            imageUrls={imageUrls}
            onImagesChange={setImageUrls}
            maxImages={3}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* 제출 버튼 */}
      <div className="sticky bottom-0 border-t bg-background p-4">
        <Button
          size="lg"
          className="h-12 w-full text-base font-semibold"
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
        >
          {isPending ? "등록 중..." : "리뷰 등록"}
        </Button>
      </div>
    </div>
  );
}
