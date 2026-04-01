import { describe, it, expect } from "vitest"
import { createOrder } from "@/entities/order/api/createOrder"
import { prismaMock } from "../helpers/prisma-mock"
import { RESTAURANT, MENU_ITEM, MENU_ITEM_SOLDOUT } from "../helpers/fixtures"
import type { CreateOrderInput } from "@/entities/order/model/types"

const BASE_INPUT: CreateOrderInput = {
  restaurantId: RESTAURANT.id,
  deliveryAddress: "서울시 강남구",
  deliveryLat: 37.4979,
  deliveryLng: 127.0276,
  items: [
    {
      menuId: MENU_ITEM.id,
      quantity: 2,
      price: MENU_ITEM.price,
      optionPrice: 0,
      selectedOptions: null,
    },
  ],
}

describe("createOrder", () => {
  it("정상 주문 생성 성공", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ...RESTAURANT,
      minOrderAmount: 12000,
    } as any)
    prismaMock.menu.findMany.mockResolvedValue([MENU_ITEM] as any)
    const createdOrder = { id: "new-order-1" }
    prismaMock.$transaction.mockImplementation(async (fn: any) => {
      return fn({
        order: { create: async () => createdOrder },
      })
    })

    const result = await createOrder("user-1", BASE_INPUT)

    expect(result).toEqual({ success: true, orderId: "new-order-1" })
  })

  it("존재하지 않는 음식점 — 실패", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(null)

    const result = await createOrder("user-1", BASE_INPUT)

    expect(result.success).toBe(false)
    expect(result.error).toContain("존재하지 않는 음식점")
  })

  it("영업 종료 음식점 — 실패", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ...RESTAURANT,
      isOpen: false,
    } as any)

    const result = await createOrder("user-1", BASE_INPUT)

    expect(result.success).toBe(false)
    expect(result.error).toContain("영업 중이 아닙니다")
  })

  it("존재하지 않는 메뉴 포함 — 실패", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(RESTAURANT as any)
    prismaMock.menu.findMany.mockResolvedValue([]) // 메뉴 없음

    const result = await createOrder("user-1", BASE_INPUT)

    expect(result.success).toBe(false)
    expect(result.error).toContain("존재하지 않는 메뉴")
  })

  it("품절 메뉴 포함 — 실패", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(RESTAURANT as any)
    prismaMock.menu.findMany.mockResolvedValue([MENU_ITEM_SOLDOUT] as any)

    const input: CreateOrderInput = {
      ...BASE_INPUT,
      items: [
        {
          menuId: MENU_ITEM_SOLDOUT.id,
          quantity: 1,
          price: MENU_ITEM_SOLDOUT.price,
          optionPrice: 0,
          selectedOptions: null,
        },
      ],
    }

    const result = await createOrder("user-1", input)

    expect(result.success).toBe(false)
    expect(result.error).toContain("품절된 메뉴")
    expect(result.error).toContain(MENU_ITEM_SOLDOUT.name)
  })

  it("가격 변동 감지 — 실패", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(RESTAURANT as any)
    prismaMock.menu.findMany.mockResolvedValue([
      { ...MENU_ITEM, price: 10000 }, // DB 가격이 변경됨
    ] as any)

    const result = await createOrder("user-1", BASE_INPUT)

    expect(result.success).toBe(false)
    expect(result.error).toContain("가격이 변경된 메뉴")
  })

  it("최소 주문금액 미달 — 실패", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ...RESTAURANT,
      minOrderAmount: 50000, // 높은 최소 주문금액
    } as any)
    prismaMock.menu.findMany.mockResolvedValue([MENU_ITEM] as any)

    const result = await createOrder("user-1", BASE_INPUT)

    expect(result.success).toBe(false)
    expect(result.error).toContain("최소 주문금액")
  })

  it("Redis 발행 실패해도 주문 성공 처리", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue({
      ...RESTAURANT,
      minOrderAmount: 12000,
    } as any)
    prismaMock.menu.findMany.mockResolvedValue([MENU_ITEM] as any)
    prismaMock.$transaction.mockImplementation(async (fn: any) => {
      return fn({
        order: { create: async () => ({ id: "order-redis-fail" }) },
      })
    })

    // publishOrderUpdate는 setup.ts에서 mock되어 있으므로
    // 여기서는 reject되도록 설정
    const { publishOrderUpdate } = await import("@/shared/api/redis")
    ;(publishOrderUpdate as any).mockRejectedValueOnce(new Error("Redis down"))

    const result = await createOrder("user-1", BASE_INPUT)

    expect(result.success).toBe(true)
    expect(result.orderId).toBe("order-redis-fail")
  })
})
