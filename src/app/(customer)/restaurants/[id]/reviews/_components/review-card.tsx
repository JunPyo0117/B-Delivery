import { Star, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import type { ReviewItem } from "../actions";

interface ReviewCardProps {
  review: ReviewItem;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const initial = review.user.nickname?.charAt(0) ?? "?";

  return (
    <div className="border-b border-gray-100 px-4 py-4">
      {/* 상단: 유저 정보 */}
      <div className="flex items-center gap-2.5">
        <Avatar className="size-9 border border-gray-100">
          <AvatarImage src={review.user.image ?? undefined} />
          <AvatarFallback className="bg-gray-100 text-xs font-medium text-gray-500">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-900">
              {review.user.nickname}
            </span>
            <span className="text-[11px] text-gray-400">
              리뷰 {review.orderMenuNames.length > 0 ? review.orderMenuNames.length : 1}
              {" "}· 평균별점 {review.rating.toFixed(1)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <div className="flex items-center gap-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3 ${
                    i < review.rating
                      ? "fill-[#FFB300] text-[#FFB300]"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-gray-400">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 주문 메뉴 태그 */}
      {review.orderMenuNames.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {review.orderMenuNames.map((name, i) => (
            <span
              key={i}
              className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* 태그 */}
      {review.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#2DB400]/10 px-2 py-0.5 text-[11px] font-medium text-[#2DB400]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 리뷰 본문 */}
      {review.content && (
        <p className="mt-2.5 text-[14px] leading-[1.6] text-gray-800">
          {review.content}
        </p>
      )}

      {/* 첨부 이미지 */}
      {review.imageUrls.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.imageUrls.map((url, i) => (
            <img
              key={url}
              src={url}
              alt={`리뷰 이미지 ${i + 1}`}
              className="size-[120px] shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {/* 신고하기 */}
      <div className="mt-3 flex justify-end">
        <button className="flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-gray-600">
          <Flag className="size-3" />
          신고하기
        </button>
      </div>
    </div>
  );
}
