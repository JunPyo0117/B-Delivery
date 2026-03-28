"use server"

import { prisma } from "@/shared/api/prisma"
import { auth } from "@/auth"

export interface ChatListItem {
  id: string
  chatType: string
  status: string
  category: string | null
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  createdAt: string
}

/**
 * 내 채팅 목록 조회 (CUSTOMER_SUPPORT만)
 * - 최신 메시지, 미읽음 수, 최신순 정렬
 */
export async function getChatList(): Promise<ChatListItem[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const userId = session.user.id

  const chats = await prisma.chat.findMany({
    where: {
      userId,
      chatType: "CUSTOMER_SUPPORT",
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          type: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
              senderId: { not: userId },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return chats.map((chat) => {
    const lastMsg = chat.messages[0] ?? null
    return {
      id: chat.id,
      chatType: chat.chatType,
      status: chat.status,
      category: chat.category,
      lastMessage: lastMsg
        ? lastMsg.type === "IMAGE"
          ? "사진을 보냈습니다"
          : lastMsg.content
        : null,
      lastMessageAt: lastMsg?.createdAt.toISOString() ?? null,
      unreadCount: chat._count.messages,
      createdAt: chat.createdAt.toISOString(),
    }
  })
}
