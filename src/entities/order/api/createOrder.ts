"use server"

import { prisma } from "@/lib/prisma"
import { publishOrderUpdate } from "@/lib/redis"
import type { Prisma } from "@/generated/prisma/client"
import type { CreateOrderInput } from "../model/types"

interface CreateOrderResult {
  success: boolean
  orderId?: string
  error?: string
}

export async function createOrder(
  userId: string,
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const {
    restaurantId,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    deliveryNote,
    items,
  } = input

  // 1. 음식점 조회 및 영업 상태 체크
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      name: true,
      isOpen: true,
      minOrderAmount: true,
      deliveryFee: true,
    },
  })

  if (!restaurant) {
    return { success: false, error: "존재하지 않는 음식점입니다." }
  }

  if (!restaurant.isOpen) {
    return {
      success: false,
      error: `${restaurant.name}은(는) 현재 영업 중이 아닙니다.`,
    }
  }

  // 2. 메뉴 일괄 조회
  const menuIds = items.map((item) => item.menuId)
  const menus = await prisma.menu.findMany({
    where: {
      id: { in: menuIds },
      restaurantId,
    },
    select: {
      id: true,
      name: true,
      price: true,
      isSoldOut: true,
    },
  })

  const menuMap = new Map(menus.map((m) => [m.id, m]))

  // 3. 품절 체크
  const soldOutItems: string[] = []
  for (const item of items) {
    const menu = menuMap.get(item.menuId)
    if (!menu) {
      return {
        success: false,
        error: `존재하지 않는 메뉴가 포함되어 있습니다. (menuId: ${item.menuId})`,
      }
    }
    if (menu.isSoldOut) {
      soldOutItems.push(menu.name)
    }
  }

  if (soldOutItems.length > 0) {
    return {
      success: false,
      error: `품절된 메뉴가 있습니다: ${soldOutItems.join(", ")}`,
    }
  }

  // 4. 가격 변동 체크
  const priceChanges: string[] = []
  for (const item of items) {
    const menu = menuMap.get(item.menuId)!
    if (menu.price !== item.price) {
      priceChanges.push(
        `${menu.name}: ${item.price.toLocaleString()}원 → ${menu.price.toLocaleString()}원`
      )
    }
  }

  if (priceChanges.length > 0) {
    return {
      success: false,
      error: `가격이 변경된 메뉴가 있습니다.\n${priceChanges.join("\n")}\n장바구니를 새로고침 해주세요.`,
    }
  }

  // 5. 최소 주문금액 체크
  const totalMenuPrice = items.reduce(
    (sum, item) => sum + (item.price + item.optionPrice) * item.quantity,
    0
  )

  if (totalMenuPrice < restaurant.minOrderAmount) {
    return {
      success: false,
      error: `최소 주문금액은 ${restaurant.minOrderAmount.toLocaleString()}원입니다. (현재: ${totalMenuPrice.toLocaleString()}원)`,
    }
  }

  // 6. 트랜잭션으로 주문 생성
  const totalPrice = totalMenuPrice + restaurant.deliveryFee

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        restaurantId,
        status: "PENDING",
        totalPrice,
        deliveryFee: restaurant.deliveryFee,
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        deliveryNote: deliveryNote ?? null,
        items: {
          create: items.map((item) => ({
            menu: { connect: { id: item.menuId } },
            quantity: item.quantity,
            price: item.price,
            optionPrice: item.optionPrice,
            selectedOptions:
              (item.selectedOptions as unknown as Prisma.InputJsonValue) ??
              undefined,
          })),
        },
      },
    })

    return created
  })

  // 7. Redis Stream에 주문 접수 이벤트 발행
  try {
    await publishOrderUpdate(order.id, "PENDING", userId)
  } catch {
    // Redis 발행 실패해도 주문 자체는 성공 처리
    console.error(
      `[createOrder] Redis 이벤트 발행 실패: orderId=${order.id}`
    )
  }

  return { success: true, orderId: order.id }
}
