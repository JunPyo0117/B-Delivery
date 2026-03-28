import { Star, MessageSquareWarning } from "lucide-react";
import type { OwnerReviewStats } from "../_actions/review-actions";

interface ReviewStatsProps {
  stats: OwnerReviewStats;
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 평균 별점 카드 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Star className="size-4 fill-[#FFB300] text-[#FFB300]" />
          평균 별점
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-400">/ 5.0</span>
        </div>
        <p className="mt-1 text-sm text-gray-400">총 {stats.totalCount}건</p>
      </div>

      {/* 미답변 리뷰 카드 */}
      <div
        className="rounded-xl border border-amber-200 p-5"
        style={{ backgroundColor: "#FFF3D6" }}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
          <MessageSquareWarning className="size-4" />
          미답변 리뷰
        </div>
        <div className="mt-3">
          <span className="text-3xl font-bold text-amber-800">
            {stats.unrepliedCount}
          </span>
          <span className="ml-1.5 text-sm text-amber-600">건</span>
        </div>
        {stats.unrepliedCount > 0 ? (
          <p className="mt-1 text-sm text-amber-600">답글을 작성해주세요</p>
        ) : (
          <p className="mt-1 text-sm text-amber-600">모두 답글 완료!</p>
        )}
      </div>
    </div>
  );
}
