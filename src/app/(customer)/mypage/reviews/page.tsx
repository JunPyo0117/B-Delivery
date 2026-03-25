import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReviewList } from "./_components/review-list";

export default async function MypageReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  const reviewItems = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    content: review.content,
    tags: review.tags,
    imageUrls: review.imageUrls,
    createdAt: review.createdAt.toISOString(),
    restaurant: {
      id: review.restaurant.id,
      name: review.restaurant.name,
      imageUrl: review.restaurant.imageUrl,
    },
  }));

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 px-4 h-12">
          <Link
            href="/mypage"
            className="text-muted-foreground hover:text-foreground"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-bold">리뷰 관리</h1>
        </div>
      </header>

      {/* 카운트 */}
      <p className="px-4 py-3 text-sm text-muted-foreground">
        총 {reviewItems.length}개
      </p>

      {/* 목록 */}
      <ReviewList reviews={reviewItems} />
    </div>
  );
}
