"use server";

import { prisma } from "@/shared/api/prisma";
import { redis } from "@/shared/api/redis";
import type {
  GetRestaurantsParams,
  GetRestaurantsResult,
  RestaurantCardData,
} from "../model/types";

const PAGE_SIZE = 20;
const CACHE_TTL = 300; // 5분

function buildCacheKey(params: GetRestaurantsParams): string {
  const { lat, lng, category, sortBy, cursor } = params;
  const normalizedLat = lat.toFixed(3);
  const normalizedLng = lng.toFixed(3);
  return `restaurants:${normalizedLat}:${normalizedLng}:${category ?? "ALL"}:${sortBy ?? "distance"}:${cursor ?? "0"}`;
}

function buildOrderByClause(sortBy: string | undefined): string {
  switch (sortBy) {
    case "rating":
      return `"avg_rating" DESC NULLS LAST, distance ASC`;
    case "minOrder":
      return `r."minOrderAmount" ASC, distance ASC`;
    case "distance":
    default:
      return `distance ASC`;
  }
}

export async function getRestaurants(
  params: GetRestaurantsParams
): Promise<GetRestaurantsResult> {
  const { lat, lng, radius = 3, category, sortBy, cursor } = params;

  // 1. 캐시 확인
  const cacheKey = buildCacheKey(params);
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as GetRestaurantsResult;
    }
  } catch {
    // Redis 에러 시 캐시 무시하고 DB 조회
  }

  // 2. PostGIS ST_DWithin + ST_Distance (GIST 공간 인덱스 활용)
  const orderByClause = buildOrderByClause(sortBy);

  const categoryFilter = category
    ? `AND r."category" = '${category}'`
    : "";

  const cursorFilter = cursor
    ? `AND r."id" > '${cursor}'`
    : "";

  const userPoint = `ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
  const radiusMeters = radius * 1000;

  const query = `
    SELECT
      r."id",
      r."name",
      r."category",
      r."imageUrl",
      r."deliveryTime",
      r."deliveryFee",
      r."minOrderAmount",
      ST_Distance(r."location"::geography, ${userPoint}) / 1000.0 AS distance,
      COALESCE(rev_agg.avg_rating, 0) AS "avg_rating",
      COALESCE(rev_agg.review_count, 0) AS "review_count"
    FROM "Restaurant" r
    LEFT JOIN (
      SELECT
        "restaurantId",
        AVG("rating")::float AS avg_rating,
        COUNT(*)::int AS review_count
      FROM "Review"
      GROUP BY "restaurantId"
    ) rev_agg ON rev_agg."restaurantId" = r."id"
    WHERE r."isOpen" = true
      AND ST_DWithin(r."location"::geography, ${userPoint}, ${radiusMeters})
      ${categoryFilter}
      ${cursorFilter}
    ORDER BY ${orderByClause}
    LIMIT ${PAGE_SIZE + 1}
  `;

  const rows = await prisma.$queryRawUnsafe<
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
  >(query);

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const restaurants: RestaurantCardData[] = items.map((row) => ({
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

  const result: GetRestaurantsResult = {
    restaurants,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    hasMore,
  };

  // 3. 캐시 저장
  try {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  } catch {
    // Redis 에러 시 무시
  }

  return result;
}
