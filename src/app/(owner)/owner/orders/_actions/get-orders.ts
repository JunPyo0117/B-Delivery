"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/client";

export type OwnerOrderItem = {
  id: string;
  menuName: string;
  quantity: number;
  price: number;
};

export type OwnerOrder = {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  deliveryAddress: string;
  customerNickname: string;
  items: OwnerOrderItem[];
  createdAt: string;
  updatedAt: string;
};

/**
 * 사장님의 음식점에 들어온 주문 목록을 조회합니다.
 * status 파라미터로 상태별 필터링이 가능합니다.
 */
export async function getOwnerOrders(
  status?: OrderStatus | "ALL"
): Promise<{ orders: OwnerOrder[]; error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { orders: [], error: "로그인이 필요합니다." };
  }

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return { orders: [], error: "권한이 없습니다." };
  }

  // 사장님이 소유한 음식점 조회
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!restaurant) {
    return { orders: [], error: "등록된 음식점이 없습니다." };
  }

  const whereClause: Record<string, unknown> = {
    restaurantId: restaurant.id,
  };

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  const orders = await prisma.order.findMany({
    where: whereClause,
    include: {
      user: { select: { nickname: true } },
      items: {
        include: {
          menu: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalPrice: order.totalPrice,
      deliveryAddress: order.deliveryAddress,
      customerNickname: order.user.nickname,
      items: order.items.map((item) => ({
        id: item.id,
        menuName: item.menu.name,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })),
  };
}
