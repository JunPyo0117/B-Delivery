import { describe, it, expect, vi, beforeEach } from "vitest"
import { prismaMock } from "../helpers/prisma-mock"
import { createMockSession, mockAuth } from "../helpers/auth-mock"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { auth } from "@/auth"
import { getReorderItems } from "@/entities/order/api/getReorderItems"

const MOCK_ORDER = {
  id: "order-1",
  userId: "user-1",
  restaurant: {
    id: "restaurant-1",
    name: "테스트 음식점",
    deliveryFee: 3000,
    minOrderAmount: 12000,
  },
  items: [
    {
      menu: {
        id: "menu-1",
        name: "김치찌개",
        price: 9000,
        imageUrl: null,
        isSoldOut: false,
      },
      quantity: 2,
    },
    {
      menu: {
        id: "menu-2",
        name: "된장찌개",
        price: 8000,
        imageUrl: "img.jpg",
        isSoldOut: false,
      },
      quantity: 1,
    },
  ],
}

describe("getReorderItems", () => {
  beforeEach(() => {
    vi.mocked(auth).mockImplementation(mockAuth(createMockSession()))
  })

  it("재주문 아이템 조회 성공", async () => {
    prismaMock.order.findUnique.mockResolvedValue(MOCK_ORDER as any)

    const result = await getReorderItems("order-1")

    expect(result.items).toHaveLength(2)
    expect(result.unavailable).toHaveLength(0)
    expect(result.items[0]).toEqual({
      menuId: "menu-1",
      name: "김치찌개",
      price: 9000,
      imageUrl: null,
      quantity: 2,
      restaurantId: "restaurant-1",
      restaurantName: "테스트 음식점",
    })
  })

  it("품절 메뉴 제외 및 unavailable 목록에 포함", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...MOCK_ORDER,
      items: [
        {
          menu: {
            id: "menu-1",
            name: "김치찌개",
            price: 9000,
            imageUrl: null,
            isSoldOut: true,
          },
          quantity: 2,
        },
        {
          menu: {
            id: "menu-2",
            name: "된장찌개",
            price: 8000,
            imageUrl: null,
            isSoldOut: false,
          },
          quantity: 1,
        },
      ],
    } as any)

    const result = await getReorderItems("order-1")

    expect(result.items).toHaveLength(1)
    expect(result.items[0].menuId).toBe("menu-2")
    expect(result.unavailable).toEqual(["김치찌개"])
  })

  it("미로그인 — 에러", async () => {
    vi.mocked(auth).mockImplementation(mockAuth(null))

    await expect(getReorderItems("order-1")).rejects.toThrow("로그인이 필요합니다")
  })

  it("주문 없음 — 에러", async () => {
    prismaMock.order.findUnique.mockResolvedValue(null)

    await expect(getReorderItems("order-1")).rejects.toThrow(
      "주문을 찾을 수 없습니다"
    )
  })

  it("다른 사용자의 주문 — 에러", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...MOCK_ORDER,
      userId: "other-user",
    } as any)

    await expect(getReorderItems("order-1")).rejects.toThrow(
      "주문을 찾을 수 없습니다"
    )
  })

  it("모든 메뉴 품절 — items 비어있고 unavailable에 모두 포함", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...MOCK_ORDER,
      items: [
        {
          menu: {
            id: "menu-1",
            name: "김치찌개",
            price: 9000,
            imageUrl: null,
            isSoldOut: true,
          },
          quantity: 2,
        },
        {
          menu: {
            id: "menu-2",
            name: "된장찌개",
            price: 8000,
            imageUrl: null,
            isSoldOut: true,
          },
          quantity: 1,
        },
      ],
    } as any)

    const result = await getReorderItems("order-1")

    expect(result.items).toHaveLength(0)
    expect(result.unavailable).toEqual(["김치찌개", "된장찌개"])
  })
})
