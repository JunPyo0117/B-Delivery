"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
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
    <div className="flex min-h-dvh flex-col bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1"
          aria-label="닫기"
        >
          <X className="size-5 text-gray-900" />
        </button>
        <h1 className="text-[16px] font-bold text-gray-900">리뷰 작성</h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
          className="text-[14px] font-bold disabled:text-gray-300 transition-colors"
          style={rating > 0 && !isPending ? { color: "#2DB400" } : {}}
        >
          {isPending ? "등록중..." : "등록"}
        </button>
      </header>

      <div className="flex-1">
        {/* 가게 정보 바 */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <p className="text-[14px] font-bold text-gray-900">{order.restaurantName}</p>
          <p className="text-[12px] text-gray-500 mt-0.5">{order.menuSummary}</p>
        </div>

        {/* 별점 */}
        <div className="flex flex-col items-center py-8 px-4">
          <p className="text-[15px] font-semibold text-gray-900 mb-4">
            음식은 어떠셨나요?
          </p>
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <p
              className="text-[14px] font-bold mt-3"
              style={{ color: "#FFB300" }}
            >
              {ratingLabels[rating]}
            </p>
          )}
        </div>

        {/* 구분선 */}
        <div className="h-[1px] bg-gray-100 mx-4" />

        {/* 태그 선택 */}
        <div className="px-4 py-5">
          <p className="text-[14px] font-semibold text-gray-900 mb-3">
            이 음식점의 장점을 알려주세요
          </p>
          <TagSelector
            selectedTags={selectedTags}
            onToggle={handleTagToggle}
          />
        </div>

        {/* 구분선 */}
        <div className="h-[1px] bg-gray-100 mx-4" />

        {/* 텍스트 리뷰 */}
        <div className="px-4 py-5">
          <textarea
            placeholder="다른 고객들에게 도움이 되는 리뷰를 남겨주세요 (선택)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full resize-none rounded-xl bg-gray-50 px-4 py-3 text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-shadow"
          />
          <p className="mt-1.5 text-right text-[11px] text-gray-400">
            {content.length}/500
          </p>
        </div>

        {/* 이미지 업로드 */}
        <div className="px-4 pb-8">
          <p className="text-[14px] font-semibold text-gray-900 mb-3">
            사진 첨부 (선택)
          </p>
          <ImageUploader
            imageUrls={imageUrls}
            onImagesChange={setImageUrls}
            maxImages={3}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-4 mb-4 rounded-lg px-4 py-3 text-[13px]" style={{ backgroundColor: "#FF52521a", color: "#FF5252" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
