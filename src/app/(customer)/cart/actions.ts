"use server";

import { auth } from "@/auth";
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

/** 주문 아이템 옵션 정보 */
export interface OrderItemOption {
  groupName: string;
  optionName: string;
  extraPrice: number;
}

/** 주문 생성 Server Action */
export interface CreateOrderInput {
  restaurantId: string;
  deliveryAddress: string;
  items: {
    menuId: string;
    quantity: number;
    price: number;
    options?: OrderItemOption[];
  }[];
}

export async function createOrder(
  input: CreateOrderInput
): Promise<{ error: string } | { orderId: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const { restaurantId, deliveryAddress, items } = input;

  // 유효성 검사
  if (!restaurantId || !deliveryAddress || !items.length) {
    return { error: "주문 정보가 올바르지 않습니다." };
  }

  // 음식점 존재 & 영업 중 확인
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, isOpen: true, minOrderAmount: true, deliveryFee: true },
  });

  if (!restaurant) {
    return { error: "음식점을 찾을 수 없습니다." };
  }

  if (!restaurant.isOpen) {
    return { error: "현재 영업 중이 아닌 음식점입니다." };
  }

  // 메뉴 유효성 검증 — DB 가격으로 계산
  const menuIds = [...new Set(items.map((item) => item.menuId))];
  const menus = await prisma.menu.findMany({
    where: { id: { in: menuIds }, restaurantId },
    select: { id: true, price: true, isSoldOut: true, name: true },
  });

  if (menus.length !== menuIds.length) {
    return { error: "유효하지 않은 메뉴가 포함되어 있습니다." };
  }

  type MenuInfo = { id: string; price: number; isSoldOut: boolean; name: string };
  const menuMap = new Map<string, MenuInfo>(
    menus.map((m: MenuInfo) => [m.id, m] as const)
  );

  // 품절 확인
  for (const item of items) {
    const menu = menuMap.get(item.menuId);
    if (!menu) {
      return { error: "유효하지 않은 메뉴가 포함되어 있습니다." };
    }
    if (menu.isSoldOut) {
      return { error: `${menu.name}은(는) 품절입니다.` };
    }
  }

  // 서버 측 총 금액 계산 (DB 가격 + 옵션 가격)
  const subtotal = items.reduce((sum, item) => {
    const menu = menuMap.get(item.menuId)!;
    const optionPrice = (item.options ?? []).reduce(
      (acc, o) => acc + o.extraPrice,
      0
    );
    return sum + (menu.price + optionPrice) * item.quantity;
  }, 0);

  // 최소 주문 금액 확인
  if (subtotal < restaurant.minOrderAmount) {
    return {
      error: `최소 주문 금액은 ${restaurant.minOrderAmount.toLocaleString()}원입니다.`,
    };
  }

  const totalPrice = subtotal + restaurant.deliveryFee;

  // 주문 생성
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      restaurantId,
      status: "PENDING",
      totalPrice,
      deliveryAddress,
      items: {
        create: items.map((item) => {
          const optionPrice = (item.options ?? []).reduce(
            (acc, o) => acc + o.extraPrice,
            0
          );
          return {
            menuId: item.menuId,
            quantity: item.quantity,
            price: menuMap.get(item.menuId)!.price,
            optionPrice,
            selectedOptions: item.options?.length
              ? item.options.map((o) => ({
                  groupName: o.groupName,
                  optionName: o.optionName,
                  extraPrice: o.extraPrice,
                }))
              : undefined,
          };
        }),
      },
    },
    select: { id: true },
  });

  return { orderId: order.id };
}
