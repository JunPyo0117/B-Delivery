import Link from "next/link";
import type { DashboardReview } from "../_actions/dashboard-actions";
import { Star, MessageCircle } from "lucide-react";

interface RecentReviewsProps {
  reviews: DashboardReview[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          style={{
            color: i < rating ? "#FFB300" : "#E0E0E0",
            fill: i < rating ? "#FFB300" : "none",
          }}
        />
      ))}
    </div>
  );
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) {
    const minutes = Math.floor(diff / 60000);
    return minutes < 1 ? "방금 전" : `${minutes}분 전`;
  }
  return `${hours}시간 전`;
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">최근 리뷰</h3>
        </div>
        <Link
          href="/owner/reviews"
          className="text-xs font-medium transition-colors hover:underline"
          style={{ color: "#2DB400" }}
        >
          전체보기
        </Link>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          최근 24시간 내 리뷰가 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-gray-100 p-3"
            >
              {/* 상단: 별점 + 닉네임 + 시간 */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-xs font-medium text-gray-700">
                    {review.user.nickname}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!review.ownerReply && (
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: "#FFEBEE", color: "#FF5252" }}
                    >
                      미답변
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {formatTimeAgo(review.createdAt)}
                  </span>
                </div>
              </div>

              {/* 주문 메뉴 */}
              <p className="text-[11px] text-gray-400 mb-1 truncate">
                {review.orderMenuNames.join(", ")}
              </p>

              {/* 리뷰 내용 */}
              {review.content && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {review.content}
                </p>
              )}

              {/* 답글 링크 */}
              {!review.ownerReply && (
                <Link
                  href="/owner/reviews"
                  className="mt-2 inline-block text-xs font-medium transition-colors hover:underline"
                  style={{ color: "#2DB400" }}
                >
                  답글 작성
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
