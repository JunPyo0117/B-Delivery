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

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      status: true,
      restaurant: { select: { ownerId: true } },
    },
  })

  if (!order) {
    return { success: false, error: "주문을 찾을 수 없습니다." }
  }

  if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
    return {
      success: false,
      error: "현재 상태에서는 주문을 취소할 수 없습니다. 고객센터에 문의해주세요.",
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "CANCELLED",
      cancelReason: cancelReason.trim(),
      cancelledBy: userId,
    },
  })

  // Redis Stream에 취소 이벤트 발행
  try {
    await publishOrderUpdate(orderId, "CANCELLED", userId, order.restaurant.ownerId)
  } catch {
    console.error(
      `[cancelOrder] Redis 이벤트 발행 실패: orderId=${orderId}`
    )
  }

  return { success: true }
}
