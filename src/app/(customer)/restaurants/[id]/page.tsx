import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RestaurantHeader } from "./_components/restaurant-header";
import { RestaurantInfo } from "./_components/restaurant-info";
import { DeliveryInfo } from "./_components/delivery-info";
import { ReviewPreview } from "./_components/review-preview";
import { MenuTabBar } from "./_components/menu-tab-bar";
import { MenuListClient } from "./_components/menu-list-client";

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
      menus: {
        orderBy: { createdAt: "asc" },
        include: {
          optionGroups: {
            include: { options: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
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

  // 메뉴 카테고리별 그룹핑 (클라이언트 직렬화를 위해 필요한 필드만 추출)
  type MenuOptionGroupData = {
    id: string;
    name: string;
    isRequired: boolean;
    maxSelect: number;
    options: { id: string; name: string; extraPrice: number }[];
  };
  type MenuWithOptions = {
    id: string;
    name: string;
    price: number;
    description: string | null;
    imageUrl: string | null;
    isSoldOut: boolean;
    optionGroups: MenuOptionGroupData[];
  };
  const menusByCategory: Record<string, MenuWithOptions[]> = {};
  for (const menu of restaurant.menus) {
    if (!menusByCategory[menu.category]) {
      menusByCategory[menu.category] = [];
    }
    menusByCategory[menu.category].push({
      id: menu.id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      imageUrl: menu.imageUrl,
      isSoldOut: menu.isSoldOut,
      optionGroups: menu.optionGroups.map(
        (g: { id: string; name: string; isRequired: boolean; maxSelect: number; options: { id: string; name: string; extraPrice: number }[] }) => ({
          id: g.id,
          name: g.name,
          isRequired: g.isRequired,
          maxSelect: g.maxSelect,
          options: g.options.map(
            (o: { id: string; name: string; extraPrice: number }) => ({
              id: o.id,
              name: o.name,
              extraPrice: o.extraPrice,
            })
          ),
        })
      ),
    });
  }
  const categories = Object.keys(menusByCategory);

  return (
    <div className="flex min-h-screen flex-col bg-white pb-4">
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

        <div className="my-3 h-px bg-gray-100" />

        <DeliveryInfo
          minOrderAmount={restaurant.minOrderAmount}
          deliveryFee={restaurant.deliveryFee}
          deliveryTime={restaurant.deliveryTime}
        />

        <div className="my-3 h-px bg-gray-100" />

        <ReviewPreview
          reviews={restaurant.reviews.map((r: { id: string; rating: number; content: string | null; tags: string[]; imageUrls: string[]; user: { nickname: string } }) => ({
            id: r.id,
            rating: r.rating,
            content: r.content,
            nickname: r.user.nickname ?? "익명",
            tags: r.tags,
            imageUrls: r.imageUrls,
          }))}
          totalCount={reviewCount}
          averageRating={averageRating}
          restaurantId={restaurant.id}
        />
      </div>

      {/* 두꺼운 구분선 */}
      <div className="my-2 h-2 bg-gray-100" />

      {categories.length > 0 && (
        <>
          <MenuTabBar categories={categories} />
          <MenuListClient
            menusByCategory={menusByCategory}
            categories={categories}
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            deliveryFee={restaurant.deliveryFee}
            minOrderAmount={restaurant.minOrderAmount}
          />
        </>
      )}
    </div>
  );
}
