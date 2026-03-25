import type { RestaurantCategory } from "@/generated/prisma/client";

export const CATEGORY_LABELS: Record<
  Exclude<RestaurantCategory, "ALL">,
  string
> = {
  KOREAN: "한식",
  CHINESE: "중식",
  JAPANESE: "일식",
  CHICKEN: "치킨",
  PIZZA: "피자",
  BUNSIK: "분식",
  JOKBAL: "족발·보쌈",
  CAFE: "카페·디저트",
  FASTFOOD: "패스트푸드",
  ETC: "기타",
};
