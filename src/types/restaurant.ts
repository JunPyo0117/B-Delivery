export interface RestaurantListItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
  minOrderAmount: number;
  deliveryFee: number;
  deliveryTime: number;
  distance: number;
  avgRating: number;
  reviewCount: number;
}

export interface RestaurantListResponse {
  restaurants: RestaurantListItem[];
  nextCursor: number | null;
}
