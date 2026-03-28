"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import type { ChatMessageResponse } from "@/types/chat"

interface GetChatMessagesResult {
  messages: ChatMessageResponse[]
  nextCursor: string | null
}

const PAGE_SIZE = 50

/**
 * 채팅방 메시지 조회
 * - 커서 페이징 50개, 오래된 순 정렬
 */
export async function getChatMessages(
  chatId: string,
  cursor?: string
): Promise<GetChatMessagesResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { messages: [], nextCursor: null }
  }

  // 채팅방 소유자 확인
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: session.user.id },
    select: { id: true },
  })

  if (!chat) {
    return { messages: [], nextCursor: null }
  }

  const messages = await prisma.message.findMany({
    where: {
      chatId,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    include: {
      sender: { select: { id: true, nickname: true } },
    },
  })

  const hasMore = messages.length > PAGE_SIZE
  const sliced = hasMore ? messages.slice(0, PAGE_SIZE) : messages

  // 오래된 순으로 뒤집기
  const items: ChatMessageResponse[] = sliced.reverse().map((m) => ({
    id: m.id,
    chatId: m.chatId,
    senderId: m.sender.id,
    nickname: m.sender.nickname,
    type: m.type as "TEXT" | "IMAGE" | "SYSTEM",
    content: m.content,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  }))

  // 다음 커서: 가장 오래된 메시지의 createdAt
  const nextCursor = hasMore ? items[0]?.createdAt ?? null : null

  return { messages: items, nextCursor }
}
