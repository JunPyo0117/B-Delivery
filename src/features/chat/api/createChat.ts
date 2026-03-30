"use server"

import { prisma } from "@/shared/api/prisma"
import { auth } from "@/auth"

interface CreateChatInput {
  orderId?: string
  category?: string
}

interface CreateChatResult {
  success: boolean
  chatId?: string
  error?: string
}

/**
 * 고객 상담 채팅 생성
 * - chatType: CUSTOMER_SUPPORT
 * - orderId, category 선택 파라미터
 */
export async function createChat(
  input: CreateChatInput
): Promise<CreateChatResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다." }
  }

  const userId = session.user.id

  // orderId가 있으면 주문 소유 확인
  if (input.orderId) {
    const order = await prisma.order.findFirst({
      where: { id: input.orderId, userId },
      select: { id: true },
    })

    if (!order) {
      return { success: false, error: "주문을 찾을 수 없습니다." }
    }
  }

  const chat = await prisma.chat.create({
    data: {
      chatType: "CUSTOMER_SUPPORT",
      userId,
      orderId: input.orderId ?? null,
      category: input.category ?? null,
    },
  })

  return { success: true, chatId: chat.id }
}
