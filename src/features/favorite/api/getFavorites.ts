"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import type { RestaurantCardData } from "@/entities/restaurant";

interface GetFavoritesParams {
  lat: number;
  lng: number;
}

export async function getFavorites(
  params: GetFavoritesParams
): Promise<RestaurantCardData[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  const userId = session.user.id;
  const { lat, lng } = params;

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      category: string;
      imageUrl: string | null;
      deliveryTime: number;
      deliveryFee: number;
      minOrderAmount: number;
      distance: number;
      avg_rating: number;
      review_count: number;
    }>
  >`
    SELECT
      r."id",
      r."name",
      r."category",
      r."imageUrl",
      r."deliveryTime",
      r."deliveryFee",
      r."minOrderAmount",
      ST_Distance(
        r."location"::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) / 1000.0 AS distance,
      COALESCE(rev_agg.avg_rating, 0) AS "avg_rating",
      COALESCE(rev_agg.review_count, 0) AS "review_count"
    FROM "FavoriteRestaurant" f
    INNER JOIN "Restaurant" r ON r."id" = f."restaurantId"
    LEFT JOIN (
      SELECT
        "restaurantId",
        AVG("rating")::float AS avg_rating,
        COUNT(*)::int AS review_count
      FROM "Review"
      GROUP BY "restaurantId"
    ) rev_agg ON rev_agg."restaurantId" = r."id"
    WHERE f."userId" = ${userId}
    ORDER BY f."createdAt" DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category as RestaurantCardData["category"],
    imageUrl: row.imageUrl,
    rating: Math.round(row.avg_rating * 10) / 10,
    reviewCount: row.review_count,
    deliveryTime: row.deliveryTime,
    deliveryFee: row.deliveryFee,
    minOrderAmount: row.minOrderAmount,
    distance: Math.round(row.distance * 10) / 10,
  }));
}
