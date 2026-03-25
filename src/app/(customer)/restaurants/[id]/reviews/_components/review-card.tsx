import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <div className="border-b border-border px-4 py-4">
      {/* 상단: 유저 정보 */}
      <div className="flex items-center gap-2.5">
        <Avatar className="size-8">
          <AvatarImage src={review.user.image ?? undefined} />
          <AvatarFallback className="text-xs">{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {review.user.nickname}
            </span>
            {review.orderMenuNames.length > 0 && (
              <span className="text-xs text-muted-foreground">
                리뷰 {review.orderMenuNames.length} · 평균별점{" "}
                {review.rating.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3 ${
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 주문 메뉴 */}
      {review.orderMenuNames.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {review.orderMenuNames.map((name, i) => (
            <span
              key={i}
              className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
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
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 리뷰 본문 */}
      {review.content && (
        <p className="mt-2 text-sm leading-relaxed">{review.content}</p>
      )}

      {/* 첨부 이미지 */}
      {review.imageUrls.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.imageUrls.map((url, i) => (
            <img
              key={url}
              src={url}
              alt={`리뷰 이미지 ${i + 1}`}
              className="size-24 shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
