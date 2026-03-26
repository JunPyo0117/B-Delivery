import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VALID_SORT_OPTIONS, type SortOption } from "@/lib/constants";
import type { RestaurantListItem } from "@/types/restaurant";
import { HomeHeader } from "./_components/home-header";
import { SearchBar } from "./_components/search-bar";
import { CategoryGrid } from "./_components/category-grid";
import { SortSelect } from "./_components/sort-select";
import { RestaurantList } from "./_components/restaurant-list";

const MAX_DISTANCE_KM = 3;
const PAGE_SIZE = 20;

const HAVERSINE_SQL = (latParam: string, lngParam: string) => `
  6371 * acos(LEAST(1.0,
    cos(radians(${latParam}::float)) * cos(radians(r.latitude)) *
    cos(radians(r.longitude) - radians(${lngParam}::float)) +
    sin(radians(${latParam}::float)) * sin(radians(r.latitude))
  ))
`;

// 정렬 옵션별 ORDER BY 절 매핑
const ORDER_BY_MAP: Record<SortOption, string> = {
  distance: "distance ASC",
  rating: '"avgRating" DESC, distance ASC',
  minOrder: 'r."minOrderAmount" ASC, distance ASC',
};

const VALID_CATEGORIES = [
  "KOREAN", "CHINESE", "JAPANESE", "CHICKEN", "PIZZA",
  "BUNSIK", "JOKBAL", "CAFE", "FASTFOOD", "ETC",
] as const;

interface HomePageProps {
  searchParams: Promise<{ category?: string; sort?: string }>;
}

async function getInitialRestaurants(
  latitude: number,
  longitude: number,
  category?: string,
  sort?: SortOption
): Promise<{ restaurants: RestaurantListItem[]; nextCursor: number | null }> {
  const haversine = HAVERSINE_SQL("$1", "$2");
  const effectiveSort: SortOption =
    sort && VALID_SORT_OPTIONS.includes(sort) ? sort : "distance";
  const orderByClause = ORDER_BY_MAP[effectiveSort];

  const useCategory =
    category &&
    category !== "ALL" &&
    VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number]);

  const query = `
    SELECT
      r.id,
      r.name,
      r.category,
      r."imageUrl",
      r."minOrderAmount",
      r."deliveryFee",
      r."deliveryTime",
      ROUND(CAST(${haversine} AS numeric), 1)::float AS distance,
      COALESCE(ROUND(AVG(rev.rating)::numeric, 1), 0)::float AS "avgRating",
      COUNT(rev.id)::int AS "reviewCount"
    FROM "Restaurant" r
    LEFT JOIN "Review" rev ON rev."restaurantId" = r.id
    WHERE r."isOpen" = true
      AND (${haversine}) <= $3::float
      ${useCategory ? `AND r."category"::text = $4::text` : ""}
    GROUP BY r.id
    ORDER BY ${orderByClause}
    LIMIT ${useCategory ? "$5" : "$4"}::int OFFSET 0
  `;

  const params: unknown[] = [latitude, longitude, MAX_DISTANCE_KM];
  if (useCategory) {
    params.push(category);
    params.push(PAGE_SIZE + 1);
  } else {
    params.push(PAGE_SIZE + 1);
  }

  const restaurants = await prisma.$queryRawUnsafe<RestaurantListItem[]>(
    query,
    ...params
  );

  const hasMore = restaurants.length > PAGE_SIZE;
  return {
    restaurants: hasMore ? restaurants.slice(0, PAGE_SIZE) : restaurants,
    nextCursor: hasMore ? PAGE_SIZE : null,
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const session = await auth();

  // OWNER는 사장 대시보드로 리다이렉트
  if (session?.user?.role === "OWNER") {
    redirect("/owner/dashboard");
  }

  // JWT가 stale할 수 있으므로 DB에서 최신 주소를 직접 조회
  let address: string | null = null;
  let latitude: number | null = null;
  let longitude: number | null = null;

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultAddress: true, latitude: true, longitude: true },
    });
    if (dbUser) {
      address = dbUser.defaultAddress;
      latitude = dbUser.latitude;
      longitude = dbUser.longitude;
    }
  }

  let initialData: {
    restaurants: RestaurantListItem[];
    nextCursor: number | null;
  } = { restaurants: [], nextCursor: null };

  if (latitude != null && longitude != null) {
    initialData = await getInitialRestaurants(
      latitude,
      longitude,
      resolvedParams.category,
      resolvedParams.sort as SortOption | undefined
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#F8F8F8]">
      <HomeHeader address={address} />
      <SearchBar />

      {/* 카테고리 + 정렬 영역 */}
      <div className="bg-white">
        <CategoryGrid />
      </div>

      {/* 구분선 */}
      <div className="h-2 bg-[#F2F2F2]" />

      {/* 정렬 칩 + 음식점 목록 */}
      <SortSelect />
      <RestaurantList
        initialRestaurants={initialData.restaurants}
        initialNextCursor={initialData.nextCursor}
      />
    </div>
  );
}
