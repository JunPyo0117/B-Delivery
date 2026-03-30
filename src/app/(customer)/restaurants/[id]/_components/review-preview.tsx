import Link from "next/link";
import { ChevronRight, Star, MessageSquare } from "lucide-react";

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

  const firstReview = reviews[0];

  return (
    <div className="py-1">
      {/* 리뷰 헤더 */}
      <Link
        href={`/restaurants/${restaurantId}/reviews`}
        className="flex items-center justify-between py-2"
      >
        <div className="flex items-center gap-1.5">
          <Star className="size-4 fill-[#FFB300] text-[#FFB300]" />
          <Star className="size-4 fill-[#FFB300] text-[#FFB300]" />
          <Star className="size-4 fill-[#FFB300] text-[#FFB300]" />
          <Star className="size-4 fill-[#FFB300] text-[#FFB300]" />
          <Star className="size-4 fill-[#FFB300] text-[#FFB300]" />
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>

      {/* 리뷰 미리보기 카드 */}
      {firstReview && (
        <Link
          href={`/restaurants/${restaurantId}/reviews`}
          className="block"
        >
          {/* 리뷰 텍스트 인용 */}
          {firstReview.content && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-700">
              {firstReview.content}
            </p>
          )}

          {/* 사장님 답글 (회색 배경 박스) */}
          <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-gray-100 px-3 py-2.5">
            <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-gray-400" />
            <p className="text-xs leading-relaxed text-gray-500">
              안녕하세요! 고객님~:)
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}
