import type { RestaurantCategory } from "@/generated/prisma/client";

export const CATEGORY_LABELS: Record<RestaurantCategory, string> = {
  KOREAN: "한식",
  CHINESE: "중식",
  JAPANESE: "일식",
  CHICKEN: "치킨",
  PIZZA: "피자",
  BUNSIK: "분식",
  JOKBAL: "족발·보쌈",
  CAFE: "카페·디저트",
  FASTFOOD: "패스트푸드",
  JJAMBBONG: "짬·탕",
  RICE_BOWL: "한그릇",
  ETC: "기타",
};

// 정렬 옵션
export const SORT_OPTIONS = {
  distance: "배달 빠른 순",
  rating: "평점 순",
  minOrder: "최소 주문금액 순",
} as const;

export type SortOption = keyof typeof SORT_OPTIONS;

export const VALID_SORT_OPTIONS = Object.keys(SORT_OPTIONS) as SortOption[];

export const CATEGORY_ICONS: Record<RestaurantCategory, string> = {
  KOREAN: "🍚",
  CHINESE: "🥟",
  JAPANESE: "🍣",
  CHICKEN: "🍗",
  PIZZA: "🍕",
  BUNSIK: "🍜",
  JOKBAL: "🥩",
  CAFE: "☕",
  FASTFOOD: "🍔",
  JJAMBBONG: "🍜",
  RICE_BOWL: "🍛",
  ETC: "🍽️",
};
