import { redirect } from "next/navigation";
import { Search, ShoppingCart } from "lucide-react";
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
    <div className="flex flex-col min-h-dvh bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 h-12">
          <h1 className="text-lg font-bold">찜</h1>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="검색">
              <Search className="size-5" />
            </button>
            <button type="button" aria-label="장바구니">
              <ShoppingCart className="size-5" />
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex px-4 gap-2 pb-2">
          <button
            type="button"
            className="px-3 py-1.5 text-sm font-semibold rounded-full bg-foreground text-background"
          >
            배달·픽업
          </button>
          <button
            type="button"
            disabled
            className="px-3 py-1.5 text-sm rounded-full border text-muted-foreground"
          >
            장보기·쇼핑
          </button>
        </div>
      </header>

      {/* 카운트 */}
      <p className="px-4 py-3 text-sm text-muted-foreground">
        총 {restaurants.length}개
      </p>

      {/* 목록 */}
      <FavoriteList restaurants={restaurants} />
    </div>
  );
}
