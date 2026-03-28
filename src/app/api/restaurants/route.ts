import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { VALID_SORT_OPTIONS, type SortOption } from "@/lib/constants";
import type { RestaurantListItem } from "@/types/restaurant";

const MAX_DISTANCE_KM = 3;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const CACHE_TTL_SECONDS = 300; // 5분

const VALID_CATEGORIES = [
  "KOREAN", "CHINESE", "JAPANESE", "CHICKEN", "PIZZA",
  "BUNSIK", "JOKBAL", "CAFE", "FASTFOOD", "ETC",
] as const;

const HAVERSINE_EXPR = `
  6371 * acos(LEAST(1.0,
    cos(radians($1::float)) * cos(radians(r.latitude)) *
    cos(radians(r.longitude) - radians($2::float)) +
    sin(radians($1::float)) * sin(radians(r.latitude))
  ))
`;

// 정렬 옵션별 ORDER BY 절 매핑
const ORDER_BY_MAP: Record<SortOption, string> = {
  distance: "distance ASC",
  rating: '"avgRating" DESC, distance ASC',
  minOrder: 'r."minOrderAmount" ASC, distance ASC',
};

/**
 * 캐시 키 생성: 위경도를 소수점 2자리(~100m 격자)로 반올림하여
 * 인접 요청이 동일 캐시를 공유하도록 합니다.
 */
function buildCacheKey(
  lat: number,
  lng: number,
  category: string | null,
  sort: string,
  cursor: number,
  limit: number,
): string {
  const latR = lat.toFixed(2);
  const lngR = lng.toFixed(2);
  const cat = category && category !== "ALL" ? category : "ALL";
  return `restaurants:${latR}:${lngR}:${cat}:${sort}:${cursor}:${limit}`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { latitude, longitude } = session.user;
  if (latitude == null || longitude == null) {
    return NextResponse.json(
      { error: "기본 주소를 먼저 설정해주세요." },
      { status: 400 }
    );
  }

  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const sortParam = searchParams.get("sort") as SortOption | null;
  const cursor = Math.max(0, parseInt(searchParams.get("cursor") ?? "0", 10));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10))
  );

  if (category && category !== "ALL" && !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return NextResponse.json(
      { error: "유효하지 않은 카테고리입니다." },
      { status: 400 }
    );
  }

  // 정렬 옵션 검증 (유효하지 않으면 기본값 distance)
  const sort: SortOption =
    sortParam && VALID_SORT_OPTIONS.includes(sortParam) ? sortParam : "distance";

  // --- Redis 캐시 조회 ---
  const cacheKey = buildCacheKey(latitude, longitude, category, sort, cursor, limit);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
  } catch {
    // Redis 연결 실패 시 무시하고 DB 직접 조회
  }

  // --- DB 조회 ---
  const useCategory = category && category !== "ALL";
  const orderByClause = ORDER_BY_MAP[sort];

  const query = `
    SELECT
      r.id,
      r.name,
      r.category,
      r."imageUrl",
      r."minOrderAmount",
      r."deliveryFee",
      r."deliveryTime",
      ROUND(CAST(${HAVERSINE_EXPR} AS numeric), 1)::float AS distance,
      COALESCE(ROUND(AVG(rev.rating)::numeric, 1), 0)::float AS "avgRating",
      COUNT(rev.id)::int AS "reviewCount"
    FROM "Restaurant" r
    LEFT JOIN "Review" rev ON rev."restaurantId" = r.id
    WHERE r."isOpen" = true
      AND (${HAVERSINE_EXPR}) <= $3::float
      ${useCategory ? `AND r."category"::text = $6::text` : ""}
    GROUP BY r.id
    ORDER BY ${orderByClause}
    LIMIT $4::int OFFSET $5::int
  `;

  const params: unknown[] = [
    latitude,
    longitude,
    MAX_DISTANCE_KM,
    limit + 1,
    cursor,
  ];
  if (useCategory) {
    params.push(category);
  }

  const restaurants = await prisma.$queryRawUnsafe<RestaurantListItem[]>(
    query,
    ...params
  );

  const hasMore = restaurants.length > limit;
  const data = hasMore ? restaurants.slice(0, limit) : restaurants;

  const responseBody = {
    restaurants: data,
    nextCursor: hasMore ? cursor + limit : null,
  };

  // --- Redis 캐시 저장 (TTL 5분) ---
  try {
    await redis.set(cacheKey, JSON.stringify(responseBody), "EX", CACHE_TTL_SECONDS);
  } catch {
    // Redis 저장 실패 시 무시 — 다음 요청에서 재시도
  }

  return NextResponse.json(responseBody);
}
