import type { RestaurantCategory } from "@/generated/prisma/enums";

export interface RestaurantCardData {
  id: string;
  name: string;
  category: RestaurantCategory;
  imageUrl: string | null;
  rating: number; // 평균 별점 (계산 필드)
  reviewCount: number; // 리뷰 수 (계산 필드)
  deliveryTime: number;
  deliveryFee: number;
  minOrderAmount: number;
  distance?: number; // 사용자 위치 기반 거리 (km)
}

export interface RestaurantDetailData extends RestaurantCardData {
  address: string;
  description: string | null;
  notice: string | null;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  latitude: number;
  longitude: number;
  ownerId: string;
}

/** getRestaurants 파라미터 */
export interface GetRestaurantsParams {
  lat: number;
  lng: number;
  radius?: number; // 기본 3km
  category?: RestaurantCategory;
  sortBy?: "distance" | "rating" | "minOrder";
  cursor?: string; // 무한스크롤 커서 (마지막 restaurant id)
}

/** getRestaurants 응답 */
export interface GetRestaurantsResult {
  restaurants: RestaurantCardData[];
  nextCursor: string | null;
  hasMore: boolean;
}
