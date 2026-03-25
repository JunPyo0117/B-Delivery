import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { RestaurantListItem } from "@/types/restaurant";

const MAX_DISTANCE_KM = 3;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

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

  const useCategory = category && category !== "ALL";

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
    ORDER BY distance ASC
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

  return NextResponse.json({
    restaurants: data,
    nextCursor: hasMore ? cursor + limit : null,
  });
}
