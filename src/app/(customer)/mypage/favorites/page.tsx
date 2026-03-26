import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FavoriteList } from "./_components/favorite-list";
import type { FavoriteRestaurantItem } from "@/types/restaurant";

export default async function MypageFavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const favorites = await prisma.favoriteRestaurant.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          category: true,
          minOrderAmount: true,
          deliveryFee: true,
          deliveryTime: true,
          isOpen: true,
          reviews: { select: { rating: true } },
          menus: { take: 3, select: { name: true } },
        },
      },
    },
  });

  const restaurants: FavoriteRestaurantItem[] = favorites.map(
    (fav: (typeof favorites)[number]) => {
      const r = fav.restaurant;
      const ratings = r.reviews.map(
        (rev: { rating: number }) => rev.rating
      );
      const avgRating =
        ratings.length > 0
          ? ratings.reduce(
              (sum: number, val: number) => sum + val,
              0
            ) / ratings.length
          : 0;

      return {
        id: r.id,
        name: r.name,
        imageUrl: r.imageUrl,
        category: r.category,
        minOrderAmount: r.minOrderAmount,
        deliveryFee: r.deliveryFee,
        deliveryTime: r.deliveryTime,
        isOpen: r.isOpen,
        avgRating,
        reviewCount: ratings.length,
        menuSummary: r.menus.map((m: { name: string }) => m.name),
      };
    }
  );

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
          <h1 className="text-[17px] font-bold text-gray-900">찜 목록</h1>
        </div>
      </header>

      {/* 카운트 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <span className="text-[13px] text-gray-500">
          총 <span className="font-semibold text-gray-900">{restaurants.length}</span>개
        </span>
      </div>

      {/* 목록 */}
      <FavoriteList restaurants={restaurants} />
    </div>
  );
}
