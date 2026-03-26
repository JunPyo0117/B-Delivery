import { redirect } from "next/navigation";
import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FavoriteList } from "./_components/favorite-list";
import type { FavoriteRestaurantItem } from "@/types/restaurant";

export default async function FavoritesPage() {
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
      <header className="sticky top-0 z-10 bg-white">
        <div className="flex items-center justify-between px-4 h-[52px]">
          <h1 className="text-lg font-bold text-black">찜</h1>
          <div className="flex items-center gap-4">
            <button type="button" aria-label="검색" className="text-gray-700">
              <Search className="size-[22px]" />
            </button>
            <Link href="/cart" className="text-gray-700" aria-label="장바구니">
              <ShoppingCart className="size-[22px]" />
            </Link>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-[#EEEEEE]">
          <button
            type="button"
            className="flex-1 py-3 text-[14px] font-bold text-black border-b-2 border-black text-center"
          >
            배달·픽업
          </button>
          <button
            type="button"
            disabled
            className="flex-1 py-3 text-[14px] text-gray-400 text-center"
          >
            장보기·쇼핑
          </button>
        </div>
      </header>

      {/* 카운트 */}
      <p className="px-4 py-3 text-[13px] text-gray-500">
        총 {restaurants.length}개
      </p>

      {/* 목록 */}
      <FavoriteList restaurants={restaurants} />
    </div>
  );
}
