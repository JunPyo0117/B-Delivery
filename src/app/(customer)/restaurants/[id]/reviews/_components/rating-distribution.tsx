import { Star } from "lucide-react";

interface RatingDistributionProps {
  averageRating: number;
  totalCount: number;
  distribution: { rating: number; count: number }[];
}

export function RatingDistribution({
  averageRating,
  totalCount,
  distribution,
}: RatingDistributionProps) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="flex items-start gap-6 px-4 py-5">
      {/* 왼쪽: 평균 별점 */}
      <div className="flex shrink-0 flex-col items-center">
        <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
        <div className="mt-1 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-3.5 ${
                i < Math.round(averageRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 오른쪽: 별점 분포 바 차트 */}
      <div className="flex flex-1 flex-col gap-1.5">
        {distribution.map(({ rating, count }) => (
          <div key={rating} className="flex items-center gap-2">
            <span className="w-5 text-right text-xs text-muted-foreground">
              {rating}점
            </span>
            <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-yellow-400 transition-all"
                style={{
                  width: `${totalCount > 0 ? (count / maxCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="w-8 text-right text-xs text-muted-foreground">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
