import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
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
    <div className="flex flex-col min-h-dvh bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link
            href="/mypage"
            className="text-gray-900 hover:text-gray-600 transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-[17px] font-bold text-gray-900">내 리뷰 관리</h1>
        </div>
      </header>

      {/* 카운트 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] text-gray-500">
          총 <span className="font-semibold text-gray-900">{reviewItems.length}</span>개
        </span>
      </div>

      {/* 목록 */}
      <ReviewList reviews={reviewItems} />
    </div>
  );
}
