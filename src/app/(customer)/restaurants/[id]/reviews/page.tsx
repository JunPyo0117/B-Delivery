import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Separator } from "@/components/ui/separator";
import { ReviewHeader } from "./_components/review-header";
import { RatingDistribution } from "./_components/rating-distribution";
import { ReviewListClient } from "./_components/review-list-client";
import { getReviewStats, getReviews } from "./actions";

export default async function ReviewListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 음식점 존재 확인
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!restaurant) notFound();

  // 리뷰 통계 + 초기 리뷰 목록 병렬 조회
  const [stats, { reviews, nextCursor }] = await Promise.all([
    getReviewStats(id),
    getReviews(id),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ReviewHeader />

      {/* 별점 분포 */}
      <RatingDistribution
        averageRating={stats.averageRating}
        totalCount={stats.totalCount}
        distribution={stats.distribution}
      />

      <Separator className="h-2 bg-muted" />

      {/* 리뷰 목록 (필터 포함) */}
      <ReviewListClient
        restaurantId={id}
        initialReviews={reviews}
        initialNextCursor={nextCursor}
        totalCount={stats.totalCount}
      />
    </div>
  );
}
