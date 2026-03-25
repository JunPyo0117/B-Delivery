/** 통합 검색 결과 항목 */
export interface SearchResultItem {
  restaurantId: string;
  restaurantName: string;
  restaurantImageUrl: string | null;
  matchedMenuName: string | null; // 메뉴 매칭이 아닌 음식점 이름 매칭일 경우 null
  price: number | null;
  avgRating: number;
  reviewCount: number;
}

export interface SearchResponse {
  results: SearchResultItem[];
}
