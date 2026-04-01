import { describe, it, expect } from "vitest"
import { getOrders } from "@/entities/order/api/getOrders"
import { prismaMock } from "../helpers/prisma-mock"

function createMockOrder(id: string, status: string, createdAt: Date) {
  return {
    id,
    status,
    totalPrice: 15000,
    deliveryFee: 3000,
    deliveryAddress: "서울시 강남구",
    deliveryNote: null,
    createdAt,
    updatedAt: createdAt,
    restaurant: { name: "테스트 음식점", imageUrl: null },
    items: [
      {
        id: `item-${id}`,
        quantity: 1,
        price: 12000,
        optionPrice: 0,
        selectedOptions: null,
        menu: { name: "김치찌개" },
      },
    ],
    review: null,
  }
}

describe("getOrders", () => {
  it("배달중 주문 목록 조회 성공", async () => {
    const orders = [
      createMockOrder("order-1", "PENDING", new Date("2026-03-31")),
      createMockOrder("order-2", "COOKING", new Date("2026-03-30")),
    ]
    prismaMock.order.findMany.mockResolvedValue(orders as any)

    const result = await getOrders({ userId: "user-1", tab: "delivering" })

    expect(result.orders).toHaveLength(2)
    expect(result.nextCursor).toBeNull()
    expect(result.orders[0].id).toBe("order-1")
  })

  it("완료 주문 목록 조회 성공", async () => {
    const orders = [
      createMockOrder("order-1", "DONE", new Date("2026-03-31")),
    ]
    prismaMock.order.findMany.mockResolvedValue(orders as any)

    const result = await getOrders({ userId: "user-1", tab: "completed" })

    expect(result.orders).toHaveLength(1)
    expect(result.orders[0].status).toBe("DONE")
  })

  it("빈 목록 반환", async () => {
    prismaMock.order.findMany.mockResolvedValue([])

    const result = await getOrders({ userId: "user-1", tab: "delivering" })

    expect(result.orders).toHaveLength(0)
    expect(result.nextCursor).toBeNull()
  })

  it("페이지네이션 — 21건 시 nextCursor 반환", async () => {
    const orders = Array.from({ length: 21 }, (_, i) =>
      createMockOrder(
        `order-${i}`,
        "PENDING",
        new Date(Date.now() - i * 60000)
      )
    )
    prismaMock.order.findMany.mockResolvedValue(orders as any)

    const result = await getOrders({ userId: "user-1", tab: "delivering" })

    expect(result.orders).toHaveLength(20)
    expect(result.nextCursor).not.toBeNull()
  })

  it("20건 이하 — nextCursor null", async () => {
    const orders = Array.from({ length: 20 }, (_, i) =>
      createMockOrder(
        `order-${i}`,
        "PENDING",
        new Date(Date.now() - i * 60000)
      )
    )
    prismaMock.order.findMany.mockResolvedValue(orders as any)

    const result = await getOrders({ userId: "user-1", tab: "delivering" })

    expect(result.orders).toHaveLength(20)
    expect(result.nextCursor).toBeNull()
  })

  it("cursor 전달 시 where 조건에 포함", async () => {
    prismaMock.order.findMany.mockResolvedValue([])

    await getOrders({
      userId: "user-1",
      tab: "delivering",
      cursor: "2026-03-30T00:00:00.000Z",
    })

    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { lt: new Date("2026-03-30T00:00:00.000Z") },
        }),
      })
    )
  })

  it("리뷰 있는 주문 — hasReview true", async () => {
    const order = {
      ...createMockOrder("order-1", "DONE", new Date("2026-03-31")),
      review: { id: "review-1" },
    }
    prismaMock.order.findMany.mockResolvedValue([order] as any)

    const result = await getOrders({ userId: "user-1", tab: "completed" })

    expect(result.orders[0].hasReview).toBe(true)
  })
})
