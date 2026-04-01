import { describe, it, expect } from "vitest"
import { getOrderDetail } from "@/entities/order/api/getOrderDetail"
import { prismaMock } from "../helpers/prisma-mock"

const MOCK_ORDER = {
  id: "order-1",
  status: "PENDING",
  totalPrice: 15000,
  deliveryFee: 3000,
  deliveryAddress: "서울시 강남구",
  deliveryNote: null,
  deliveryLat: 37.4979,
  deliveryLng: 127.0276,
  createdAt: new Date("2026-03-31"),
  updatedAt: new Date("2026-03-31"),
  restaurant: {
    id: "restaurant-1",
    name: "테스트 음식점",
    imageUrl: null,
    latitude: 37.5665,
    longitude: 126.978,
  },
  items: [
    {
      id: "item-1",
      quantity: 2,
      price: 9000,
      optionPrice: 0,
      selectedOptions: null,
      menu: { name: "김치찌개" },
    },
  ],
  review: null,
  delivery: null,
}

describe("getOrderDetail", () => {
  it("주문 상세 조회 성공", async () => {
    prismaMock.order.findFirst.mockResolvedValue(MOCK_ORDER as any)

    const result = await getOrderDetail("order-1", "user-1")

    expect(result).not.toBeNull()
    expect(result!.id).toBe("order-1")
    expect(result!.restaurantName).toBe("테스트 음식점")
    expect(result!.items).toHaveLength(1)
    expect(result!.items[0].menuName).toBe("김치찌개")
    expect(result!.hasReview).toBe(false)
    expect(result!.delivery).toBeNull()
  })

  it("주문 없음 — null 반환", async () => {
    prismaMock.order.findFirst.mockResolvedValue(null)

    const result = await getOrderDetail("non-existent", "user-1")

    expect(result).toBeNull()
  })

  it("다른 사용자 주문 — null 반환 (userId 필터)", async () => {
    prismaMock.order.findFirst.mockResolvedValue(null)

    const result = await getOrderDetail("order-1", "other-user")

    expect(result).toBeNull()
    expect(prismaMock.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "order-1", userId: "other-user" },
      })
    )
  })

  it("리뷰 있는 주문 — hasReview true", async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      ...MOCK_ORDER,
      review: { id: "review-1" },
    } as any)

    const result = await getOrderDetail("order-1", "user-1")

    expect(result!.hasReview).toBe(true)
  })

  it("배달 정보 포함 주문", async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      ...MOCK_ORDER,
      delivery: {
        id: "delivery-1",
        status: "ACCEPTED",
        estimatedTime: 15,
        rider: {
          nickname: "배달기사1",
          riderProfile: { transportType: "MOTORCYCLE" },
        },
      },
    } as any)

    const result = await getOrderDetail("order-1", "user-1")

    expect(result!.delivery).not.toBeNull()
    expect(result!.delivery!.riderNickname).toBe("배달기사1")
    expect(result!.delivery!.riderTransport).toBe("MOTORCYCLE")
    expect(result!.delivery!.estimatedTime).toBe(15)
  })

  it("배달 정보 있지만 기사 미배정", async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      ...MOCK_ORDER,
      delivery: {
        id: "delivery-1",
        status: "REQUESTED",
        estimatedTime: null,
        rider: null,
      },
    } as any)

    const result = await getOrderDetail("order-1", "user-1")

    expect(result!.delivery).not.toBeNull()
    expect(result!.delivery!.riderNickname).toBeNull()
    expect(result!.delivery!.riderTransport).toBeNull()
  })

  it("deliveryLat/Lng null 시 0으로 반환", async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      ...MOCK_ORDER,
      deliveryLat: null,
      deliveryLng: null,
    } as any)

    const result = await getOrderDetail("order-1", "user-1")

    expect(result!.deliveryLat).toBe(0)
    expect(result!.deliveryLng).toBe(0)
  })
})
