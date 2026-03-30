import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { Star } from "lucide-react";
import { ReviewStats } from "./_components/review-stats";
import { ReviewList } from "./_components/review-list";
import {
  getOwnerReviews,
  getOwnerReviewStats,
} from "./_actions/review-actions";

export const metadata = { title: "리뷰 관리 - B-Delivery 사장님" };

export default async function OwnerReviewsPage() {
  const session = await auth();

  // 사장님이 소유한 음식점 조회
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session!.user.id },
    select: { id: true, name: true },
  });

  if (!restaurant) {
    return (
      <div>
        <div className="px-4 py-5" style={{ backgroundColor: "#2DB400" }}>
          <h1 className="text-lg font-bold text-white">리뷰 관리</h1>
        </div>
        <div className="p-4">
          <div className="rounded-xl border bg-white p-8 text-center">
            <Star className="mx-auto size-10 text-gray-300" />
            <p className="mt-3 text-gray-500">
              등록된 음식점이 없습니다. 음식점을 먼저 등록해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 리뷰 데이터 + 통계 동시 조회
  const [reviews, stats] = await Promise.all([
    getOwnerReviews(restaurant.id),
    getOwnerReviewStats(restaurant.id),
  ]);

  return (
    <div>
      {/* 헤더 */}
      <div className="px-4 py-5" style={{ backgroundColor: "#2DB400" }}>
        <h1 className="text-lg font-bold text-white">리뷰 관리</h1>
        <p className="mt-0.5 text-sm text-white/70">{restaurant.name}</p>
      </div>

      <div className="space-y-6 p-4">
        {/* 통계 카드 */}
        <ReviewStats stats={stats} />

        {/* 리뷰 리스트 */}
        <ReviewList reviews={reviews} />
      </div>
    </div>
  );
}
