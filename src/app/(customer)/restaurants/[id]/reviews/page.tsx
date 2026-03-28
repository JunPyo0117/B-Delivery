import { notFound } from "next/navigation";
import { prisma } from "@/shared/api/prisma";
import { ReviewListPage } from "@/pages/review";
import { getReviewStats, getReviews } from "./actions";

export default async function ReviewListRoute({
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
    <ReviewListPage
      restaurantId={id}
      stats={stats}
      initialReviews={reviews}
      initialNextCursor={nextCursor}
      getReviews={getReviews}
    />
  );
}
