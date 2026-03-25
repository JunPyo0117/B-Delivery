import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";

interface ReviewData {
  id: string;
  rating: number;
  content: string | null;
  nickname: string;
  tags?: string[];
  imageUrls?: string[];
}

interface ReviewPreviewProps {
  reviews: ReviewData[];
  totalCount: number;
  averageRating: number;
  restaurantId: string;
}

export function ReviewPreview({
  reviews,
  totalCount,
  averageRating,
  restaurantId,
}: ReviewPreviewProps) {
  if (totalCount === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        아직 리뷰가 없습니다
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/restaurants/${restaurantId}/reviews`}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-1">
          <Star className="size-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            리뷰 {totalCount.toLocaleString()}개
          </span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>

      <div className="mt-2 space-y-2">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1">
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
              <span className="ml-1 text-xs text-muted-foreground">
                {review.nickname}
              </span>
            </div>
            {review.tags && review.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
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
            {review.content && (
              <p className="mt-1 line-clamp-2 text-sm">{review.content}</p>
            )}
            {review.imageUrls && review.imageUrls.length > 0 && (
              <div className="mt-2 flex gap-1.5 overflow-x-auto">
                {review.imageUrls.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt={`리뷰 이미지 ${i + 1}`}
                    className="size-16 shrink-0 rounded-md object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
