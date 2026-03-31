import { describe, it, expect } from "vitest"
import { cancelOrder } from "@/entities/order/api/cancelOrder"
import { prismaMock } from "../helpers/prisma-mock"
import { ORDER, RESTAURANT } from "../helpers/fixtures"

describe("cancelOrder", () => {
  it("PENDING 주문 취소 성공", async () => {
    // updateMany: 1건 업데이트 성공
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 })
    // 성공 후 ownerId 조회용 findFirst
    prismaMock.order.findFirst.mockResolvedValue({
      restaurant: { ownerId: RESTAURANT.ownerId },
    } as any)

    const result = await cancelOrder(ORDER.userId, ORDER.id, "단순 변심")

    expect(result).toEqual({ success: true })
    expect(prismaMock.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: ORDER.id,
          userId: ORDER.userId,
        }),
        data: expect.objectContaining({
          status: "CANCELLED",
          cancelReason: "단순 변심",
        }),
      })
    )
  })

  it("WAITING_RIDER 주문 취소 실패 — 취소 불가 상태", async () => {
    // updateMany: 취소 불가 상태이므로 0건
    prismaMock.order.updateMany.mockResolvedValue({ count: 0 })
    // findFirst: 주문은 존재하지만 취소 불가 상태
    prismaMock.order.findFirst.mockResolvedValue({
      status: "WAITING_RIDER",
    } as any)

    const result = await cancelOrder(ORDER.userId, ORDER.id, "단순 변심")

    expect(result.success).toBe(false)
    expect(result.error).toContain("취소할 수 없습니다")
  })

  it("다른 사용자 주문 취소 실패 — 주문 없음", async () => {
    // updateMany: 다른 userId이므로 0건
    prismaMock.order.updateMany.mockResolvedValue({ count: 0 })
    // findFirst: userId 불일치로 null 반환
    prismaMock.order.findFirst.mockResolvedValue(null)

    const result = await cancelOrder("other-user-id", ORDER.id, "단순 변심")

    expect(result.success).toBe(false)
    expect(result.error).toContain("찾을 수 없습니다")
  })

  it("빈 취소 사유 거부 — 공백만 입력", async () => {
    const result = await cancelOrder(ORDER.userId, ORDER.id, "  ")

    expect(result.success).toBe(false)
    expect(result.error).toContain("취소 사유")
    // DB 호출 없어야 함
    expect(prismaMock.order.updateMany).not.toHaveBeenCalled()
  })

  it("존재하지 않는 주문 취소 실패", async () => {
    // updateMany: 주문이 없으므로 0건
    prismaMock.order.updateMany.mockResolvedValue({ count: 0 })
    // findFirst: 주문 자체가 없음
    prismaMock.order.findFirst.mockResolvedValue(null)

    const result = await cancelOrder(ORDER.userId, "non-existent-order", "단순 변심")

    expect(result.success).toBe(false)
    expect(result.error).toContain("찾을 수 없습니다")
  })
})
