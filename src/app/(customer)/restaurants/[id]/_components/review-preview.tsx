import { Star } from "lucide-react";

interface ReviewData {
  id: string;
  rating: number;
  content: string | null;
  nickname: string;
}

interface ReviewPreviewProps {
  reviews: ReviewData[];
  totalCount: number;
  averageRating: number;
}

export function ReviewPreview({
  reviews,
  totalCount,
  averageRating,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star className="size-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-semibold">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            리뷰 {totalCount.toLocaleString()}개
          </span>
        </div>
      </div>

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
            {review.content && (
              <p className="mt-1 line-clamp-2 text-sm">{review.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
