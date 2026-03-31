"use server"

import { prisma } from "@/shared/api/prisma"
import { publishOrderUpdate } from "@/shared/api/redis"
import { CUSTOMER_CANCELLABLE } from "../model/types"

interface CancelOrderResult {
  success: boolean
  error?: string
}

export async function cancelOrder(
  userId: string,
  orderId: string,
  cancelReason: string
): Promise<CancelOrderResult> {
  if (!cancelReason.trim()) {
    return { success: false, error: "취소 사유를 입력해주세요." }
  }

  // 원자적 취소: 현재 상태가 취소 가능한 상태일 때만 업데이트
  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      userId,
      status: { in: CUSTOMER_CANCELLABLE },
    },
    data: {
      status: "CANCELLED",
      cancelReason: cancelReason.trim(),
      cancelledBy: userId,
    },
  })

  if (result.count === 0) {
    // 주문 존재 여부 확인하여 적절한 에러 메시지 반환
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { status: true },
    })
    if (!order) {
      return { success: false, error: "주문을 찾을 수 없습니다." }
    }
    return {
      success: false,
      error: "현재 상태에서는 주문을 취소할 수 없습니다. 고객센터에 문의해주세요.",
    }
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId },
    select: { restaurant: { select: { ownerId: true } } },
  })

  // Redis Stream에 취소 이벤트 발행
  try {
    await publishOrderUpdate(orderId, "CANCELLED", userId, order?.restaurant?.ownerId ?? "")
  } catch {
    console.error(
      `[cancelOrder] Redis 이벤트 발행 실패: orderId=${orderId}`
    )
  }

  return { success: true }
}
