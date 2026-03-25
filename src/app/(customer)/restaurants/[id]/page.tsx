import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RestaurantHeader } from "./_components/restaurant-header";
import { RestaurantInfo } from "./_components/restaurant-info";
import { DeliveryInfo } from "./_components/delivery-info";
import { ReviewPreview } from "./_components/review-preview";
import { MenuTabBar } from "./_components/menu-tab-bar";
import { MenuSection } from "./_components/menu-section";
import { Separator } from "@/components/ui/separator";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      menus: { orderBy: { createdAt: "asc" } },
      reviews: {
        take: 2,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { nickname: true } } },
      },
      _count: { select: { reviews: true } },
    },
  });

  if (!restaurant) notFound();

  const ratingAgg = await prisma.review.aggregate({
    where: { restaurantId: id },
    _avg: { rating: true },
  });

  const isFavorited = session?.user?.id
    ? !!(await prisma.favoriteRestaurant.findUnique({
        where: {
          userId_restaurantId: {
            userId: session.user.id,
            restaurantId: id,
          },
        },
      }))
    : false;

  const averageRating = ratingAgg._avg.rating ?? 0;
  const reviewCount = restaurant._count.reviews;

  // 메뉴 카테고리별 그룹핑
  const menusByCategory: Record<string, typeof restaurant.menus> = {};
  for (const menu of restaurant.menus) {
    if (!menusByCategory[menu.category]) {
      menusByCategory[menu.category] = [];
    }
    menusByCategory[menu.category].push(menu);
  }
  const categories = Object.keys(menusByCategory);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-4">
      <RestaurantHeader
        imageUrl={restaurant.imageUrl}
        name={restaurant.name}
      />

      <div className="px-4">
        <RestaurantInfo
          name={restaurant.name}
          averageRating={averageRating}
          reviewCount={reviewCount}
          restaurantId={restaurant.id}
          isFavorited={isFavorited}
          isLoggedIn={!!session?.user?.id}
        />

        <Separator className="my-3" />

        <DeliveryInfo
          minOrderAmount={restaurant.minOrderAmount}
          deliveryFee={restaurant.deliveryFee}
          deliveryTime={restaurant.deliveryTime}
        />

        <Separator className="my-3" />

        <ReviewPreview
          reviews={restaurant.reviews.map((r: { id: string; rating: number; content: string | null; user: { nickname: string } }) => ({
            id: r.id,
            rating: r.rating,
            content: r.content,
            nickname: r.user.nickname ?? "익명",
          }))}
          totalCount={reviewCount}
          averageRating={averageRating}
        />
      </div>

      <Separator className="my-3 h-2 bg-muted" />

      {categories.length > 0 && (
        <>
          <MenuTabBar categories={categories} />
          <div className="px-4">
            {categories.map((category) => (
              <MenuSection
                key={category}
                category={category}
                menus={menusByCategory[category]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
