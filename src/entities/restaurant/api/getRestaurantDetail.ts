"use server";

import { prisma } from "@/lib/prisma";
import type { RestaurantDetailData } from "../model/types";

/** 메뉴 옵션 (restaurant 슬라이스 내부에서만 사용) */
interface MenuOptionResult {
  id: string;
  name: string;
  extraPrice: number;
  sortOrder: number;
}

interface MenuOptionGroupResult {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  sortOrder: number;
  options: MenuOptionResult[];
}

interface MenuItemResult {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: string;
  isSoldOut: boolean;
  isPopular: boolean;
  isNew: boolean;
  optionGroups: MenuOptionGroupResult[];
}

interface MenuCategoryGroupResult {
  category: string;
  items: MenuItemResult[];
}

export interface RestaurantDetailResult {
  restaurant: RestaurantDetailData;
  menuGroups: MenuCategoryGroupResult[];
}

/**
 * 음식점 상세 정보 + 메뉴(카테고리별 그룹) + 리뷰 집계를 한번에 가져옵니다.
 */
export async function getRestaurantDetail(
  restaurantId: string,
  userLat?: number,
  userLng?: number
): Promise<RestaurantDetailResult | null> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      menus: {
        include: {
          optionGroups: {
            include: {
              options: {
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: [{ category: "asc" }, { createdAt: "asc" }],
      },
      reviews: {
        select: { rating: true },
      },
    },
  });

  if (!restaurant) return null;

  // 리뷰 집계
  const reviewCount = restaurant.reviews.length;
  const rating =
    reviewCount > 0
      ? Math.round(
          (restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) /
            reviewCount) *
            10
        ) / 10
      : 0;

  // 거리 계산 (사용자 위치가 있으면)
  let distance: number | undefined;
  if (userLat !== undefined && userLng !== undefined) {
    distance = calculateHaversineDistance(
      userLat,
      userLng,
      restaurant.latitude,
      restaurant.longitude
    );
  }

  // 메뉴를 카테고리별로 그룹핑
  const menuMap = new Map<string, MenuItemResult[]>();
  for (const menu of restaurant.menus) {
    const item: MenuItemResult = {
      id: menu.id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      imageUrl: menu.imageUrl,
      category: menu.category,
      isSoldOut: menu.isSoldOut,
      isPopular: menu.isPopular,
      isNew: menu.isNew,
      optionGroups: menu.optionGroups.map((group) => ({
        id: group.id,
        name: group.name,
        isRequired: group.isRequired,
        maxSelect: group.maxSelect,
        sortOrder: group.sortOrder,
        options: group.options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          extraPrice: opt.extraPrice,
          sortOrder: opt.sortOrder,
        })),
      })),
    };

    const existing = menuMap.get(menu.category);
    if (existing) {
      existing.push(item);
    } else {
      menuMap.set(menu.category, [item]);
    }
  }

  const menuGroups: MenuCategoryGroupResult[] = Array.from(menuMap.entries()).map(
    ([category, items]) => ({ category, items })
  );

  const restaurantData: RestaurantDetailData = {
    id: restaurant.id,
    name: restaurant.name,
    category: restaurant.category,
    imageUrl: restaurant.imageUrl,
    rating,
    reviewCount,
    deliveryTime: restaurant.deliveryTime,
    deliveryFee: restaurant.deliveryFee,
    minOrderAmount: restaurant.minOrderAmount,
    distance,
    address: restaurant.address,
    description: restaurant.description,
    notice: restaurant.notice,
    isOpen: restaurant.isOpen,
    openTime: restaurant.openTime,
    closeTime: restaurant.closeTime,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    ownerId: restaurant.ownerId,
  };

  return {
    restaurant: restaurantData,
    menuGroups,
  };
}

/**
 * Haversine 공식으로 두 좌표 사이의 거리를 계산합니다 (km).
 */
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // 지구 반경 (km)
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
