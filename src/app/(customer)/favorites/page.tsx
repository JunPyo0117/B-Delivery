import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FavoritesPage } from "@/views/favorites";
import type { FavoriteRestaurantItem } from "@/types/restaurant";

export default async function FavoritesRoute() {
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

  return <FavoritesPage restaurants={restaurants} />;
}
