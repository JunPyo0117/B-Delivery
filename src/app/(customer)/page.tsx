import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { RestaurantListItem } from "@/types/restaurant";
import { HomeHeader } from "./_components/home-header";
import { CategoryGrid } from "./_components/category-grid";
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

async function getInitialRestaurants(
  latitude: number,
  longitude: number
): Promise<{ restaurants: RestaurantListItem[]; nextCursor: number | null }> {
  const haversine = HAVERSINE_SQL("$1", "$2");

  const restaurants = await prisma.$queryRawUnsafe<RestaurantListItem[]>(
    `
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
    GROUP BY r.id
    ORDER BY distance ASC
    LIMIT $4::int OFFSET 0
    `,
    latitude,
    longitude,
    MAX_DISTANCE_KM,
    PAGE_SIZE + 1
  );

  const hasMore = restaurants.length > PAGE_SIZE;
  return {
    restaurants: hasMore ? restaurants.slice(0, PAGE_SIZE) : restaurants,
    nextCursor: hasMore ? PAGE_SIZE : null,
  };
}

export default async function HomePage() {
  const session = await auth();

  const latitude = session?.user?.latitude;
  const longitude = session?.user?.longitude;

  let initialData: {
    restaurants: RestaurantListItem[];
    nextCursor: number | null;
  } = { restaurants: [], nextCursor: null };

  if (latitude != null && longitude != null) {
    initialData = await getInitialRestaurants(latitude, longitude);
  }

  return (
    <div className="flex flex-col">
      <HomeHeader address={session?.user?.defaultAddress ?? null} />
      <CategoryGrid />
      <RestaurantList
        initialRestaurants={initialData.restaurants}
        initialNextCursor={initialData.nextCursor}
      />
    </div>
  );
}
