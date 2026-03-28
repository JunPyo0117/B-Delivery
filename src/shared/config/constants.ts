import type { RestaurantCategory } from "@/generated/prisma/client"

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
}

export const CATEGORY_ICONS: Record<RestaurantCategory, string> = {
  KOREAN: "🍚",
  CHINESE: "🥟",
  JAPANESE: "🍣",
  CHICKEN: "🍗",
  PIZZA: "🍕",
  BUNSIK: "🍢",
  JOKBAL: "🦶",
  CAFE: "☕",
  FASTFOOD: "🍔",
  JJAMBBONG: "🍜",
  RICE_BOWL: "🍛",
  ETC: "🍽️",
}

export const SORT_OPTIONS = [
  { value: "deliveryTime", label: "배달 빠른 순" },
  { value: "rating", label: "평점 순" },
  { value: "minOrderAmount", label: "최소 주문금액 순" },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]["value"]

// 이동수단별 평균속도 (km/h)
export const TRANSPORT_SPEED = {
  WALK: 4,
  BICYCLE: 15,
  MOTORCYCLE: 30,
  CAR: 25,
} as const
