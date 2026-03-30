"use server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/shared/api/prisma";
import type { RestaurantCardData } from "@/entities/restaurant";

export interface SearchRestaurantsParams {
  query: string;
  lat: number;
  lng: number;
  radius?: number;
}

export interface SearchMenuMatch {
  menuId: string;
  menuName: string;
  menuPrice: number;
  menuCategory: string;
}

export interface SearchResultItem extends RestaurantCardData {
  matchedMenus: SearchMenuMatch[];
}

/**
 * 음식점명 / 메뉴명 / 메뉴 카테고리 통합 검색
 * PostGIS ST_DWithin + ST_Distance (GIST 공간 인덱스 활용)
 */
export async function searchRestaurants(
  params: SearchRestaurantsParams
): Promise<SearchResultItem[]> {
  const { query, lat, lng, radius = 3 } = params;

  const trimmed = query.trim();
  if (!trimmed) return [];

  const likePattern = `%${trimmed}%`;
  const radiusMeters = radius * 1000;

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
    SELECT DISTINCT
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
    FROM "Restaurant" r
    LEFT JOIN "Menu" m ON m."restaurantId" = r."id"
    LEFT JOIN (
      SELECT
        "restaurantId",
        AVG("rating")::float AS avg_rating,
        COUNT(*)::int AS review_count
      FROM "Review"
      GROUP BY "restaurantId"
    ) rev_agg ON rev_agg."restaurantId" = r."id"
    WHERE r."isOpen" = true
      AND (
        r."name" ILIKE ${likePattern}
        OR m."name" ILIKE ${likePattern}
        OR m."category" ILIKE ${likePattern}
      )
      AND ST_DWithin(
        r."location"::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY distance ASC
    LIMIT 50
  `;

  if (rows.length === 0) return [];

  const restaurantIds = rows.map((r) => r.id);

  const matchedMenus = await prisma.$queryRaw<
    Array<{
      restaurantId: string;
      menuId: string;
      menuName: string;
      menuPrice: number;
      menuCategory: string;
    }>
  >`
    SELECT
      m."restaurantId",
      m."id" AS "menuId",
      m."name" AS "menuName",
      m."price" AS "menuPrice",
      m."category" AS "menuCategory"
    FROM "Menu" m
    WHERE m."restaurantId" IN (${Prisma.join(restaurantIds)})
      AND (m."name" ILIKE ${likePattern} OR m."category" ILIKE ${likePattern})
      AND m."isSoldOut" = false
  `;

  const menusByRestaurant = new Map<string, SearchMenuMatch[]>();
  for (const menu of matchedMenus) {
    const existing = menusByRestaurant.get(menu.restaurantId) ?? [];
    existing.push({
      menuId: menu.menuId,
      menuName: menu.menuName,
      menuPrice: menu.menuPrice,
      menuCategory: menu.menuCategory,
    });
    menusByRestaurant.set(menu.restaurantId, existing);
  }

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
    matchedMenus: menusByRestaurant.get(row.id) ?? [],
  }));
}
