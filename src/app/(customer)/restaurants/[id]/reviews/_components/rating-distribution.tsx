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
    <div className="flex items-start gap-8 px-5 py-6">
      {/* 왼쪽: 평균 별점 */}
      <div className="flex shrink-0 flex-col items-center">
        <span className="text-[36px] font-bold leading-none text-gray-900">
          {averageRating.toFixed(1)}
        </span>
        <div className="mt-2 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-4 ${
                i < Math.round(averageRating)
                  ? "fill-[#FFB300] text-[#FFB300]"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 오른쪽: 별점 분포 바 차트 */}
      <div className="flex flex-1 flex-col gap-[6px]">
        {distribution.map(({ rating, count }) => (
          <div key={rating} className="flex items-center gap-2">
            <span className="w-6 text-right text-xs font-medium text-gray-400">
              {rating}점
            </span>
            <div className="relative h-[10px] flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#FFB300] transition-all duration-300"
                style={{
                  width: `${totalCount > 0 ? (count / maxCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="w-8 text-right text-xs tabular-nums text-gray-400">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
