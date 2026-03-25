"use server";

import { prisma } from "@/lib/prisma";

/** 음식점의 배달비, 최소주문금액 조회 */
export async function getRestaurantDeliveryInfo(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      deliveryFee: true,
      minOrderAmount: true,
    },
  });

  if (!restaurant) {
    return { deliveryFee: 0, minOrderAmount: 0 };
  }

  return {
    deliveryFee: restaurant.deliveryFee,
    minOrderAmount: restaurant.minOrderAmount,
  };
}
