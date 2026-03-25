"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface ReorderItem {
  menuId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

/**
 * 주문 아이템을 기반으로 재주문용 데이터를 반환한다.
 * 품절/삭제된 메뉴는 제외하고 현재 가격으로 반환한다.
 */
export async function getReorderItems(
  orderId: string
): Promise<{ items: ReorderItem[]; unavailable: string[] }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          deliveryFee: true,
          minOrderAmount: true,
        },
      },
      items: {
        include: {
          menu: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              isSoldOut: true,
            },
          },
        },
      },
    },
  });

  if (!order || order.userId !== session.user.id) {
    throw new Error("주문을 찾을 수 없습니다.");
  }

  const items: ReorderItem[] = [];
  const unavailable: string[] = [];

  for (const item of order.items) {
    if (item.menu.isSoldOut) {
      unavailable.push(item.menu.name);
      continue;
    }

    items.push({
      menuId: item.menu.id,
      name: item.menu.name,
      price: item.menu.price,
      imageUrl: item.menu.imageUrl,
      quantity: item.quantity,
      restaurantId: order.restaurant.id,
      restaurantName: order.restaurant.name,
    });
  }

  return { items, unavailable };
}
