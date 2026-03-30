import { RestaurantDetailPage } from "@/views/restaurant-detail";

export default async function RestaurantDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RestaurantDetailPage restaurantId={id} />;
}
