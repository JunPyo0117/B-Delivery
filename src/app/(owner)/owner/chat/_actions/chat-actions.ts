"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Types ──────────────────────────────────────────────

export type OwnerChatItem = {
  id: string;
  category: string | null;
  status: "WAITING" | "IN_PROGRESS" | "CLOSED";
  orderId: string | null;
  lastMessage: {
    content: string;
    type: string;
    createdAt: string;
    senderId: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OwnerChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  nickname: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  content: string;
  isRead: boolean;
  createdAt: string;
};

// ─── getOwnerChats ──────────────────────────────────────

/**
 * 사장님의 고객센터 상담 채팅 목록을 조회합니다.
 * chatType=OWNER_SUPPORT & userId=현재 사용자
 */
export async function getOwnerChats(): Promise<{
  success: boolean;
  chats: OwnerChatItem[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, chats: [], error: "인증이 필요합니다." };
  }

  try {
    const chats = await prisma.chat.findMany({
      where: {
        chatType: "OWNER_SUPPORT",
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            type: true,
            createdAt: true,
            senderId: true,
            isRead: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: session.user.id },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const items: OwnerChatItem[] = chats.map((chat) => ({
      id: chat.id,
      category: chat.category,
      status: chat.status as OwnerChatItem["status"],
      orderId: chat.orderId,
      lastMessage: chat.messages[0]
        ? {
            content: chat.messages[0].content,
            type: chat.messages[0].type,
            createdAt: chat.messages[0].createdAt.toISOString(),
            senderId: chat.messages[0].senderId,
            isRead: chat.messages[0].isRead,
          }
        : null,
      unreadCount: chat._count.messages,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    }));

    return { success: true, chats: items };
  } catch (error) {
    console.error("[getOwnerChats] Error:", error);
    return { success: false, chats: [], error: "채팅 목록을 불러오지 못했습니다." };
  }
}

// ─── createOwnerChat ────────────────────────────────────

/**
 * 사장님이 새 고객센터 상담을 시작합니다.
 */
export async function createOwnerChat(
  category?: string,
  orderId?: string
): Promise<{ success: boolean; chatId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // orderId가 제공된 경우 사장의 음식점 주문인지 확인
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurant: { ownerId: session.user.id },
      },
    });
    if (!order) {
      return { success: false, error: "주문을 찾을 수 없습니다." };
    }
  }

  try {
    const chat = await prisma.chat.create({
      data: {
        chatType: "OWNER_SUPPORT",
        userId: session.user.id,
        category: category || null,
        orderId: orderId || null,
      },
    });

    revalidatePath("/owner/chat");
    return { success: true, chatId: chat.id };
  } catch (error) {
    console.error("[createOwnerChat] Error:", error);
    return { success: false, error: "채팅을 생성하지 못했습니다." };
  }
}

// ─── getChatMessages ────────────────────────────────────

/**
 * 채팅방의 메시지를 조회합니다. 소유권 확인 포함.
 */
export async function getChatMessages(
  chatId: string,
  cursor?: string,
  limit: number = 50
): Promise<{
  success: boolean;
  messages: OwnerChatMessage[];
  hasMore: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, messages: [], hasMore: false, error: "인증이 필요합니다." };
  }

  // 소유권 확인 (사장이 생성한 OWNER_SUPPORT 채팅)
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      chatType: "OWNER_SUPPORT",
      OR: [
        { userId: session.user.id },
        { adminId: session.user.id },
      ],
    },
  });

  if (!chat) {
    return { success: false, messages: [], hasMore: false, error: "채팅방을 찾을 수 없습니다." };
  }

  try {
    const rawMessages = await prisma.message.findMany({
      where: {
        chatId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        sender: { select: { id: true, nickname: true } },
      },
    });

    const hasMore = rawMessages.length > limit;
    const messages: OwnerChatMessage[] = (
      hasMore ? rawMessages.slice(0, limit) : rawMessages
    )
      .reverse()
      .map((m) => ({
        id: m.id,
        chatId: m.chatId,
        senderId: m.sender.id,
        nickname: m.sender.nickname,
        type: m.type as "TEXT" | "IMAGE" | "SYSTEM",
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      }));

    return { success: true, messages, hasMore };
  } catch (error) {
    console.error("[getChatMessages] Error:", error);
    return { success: false, messages: [], hasMore: false, error: "메시지를 불러오지 못했습니다." };
  }
}

// ─── sendMessage ────────────────────────────────────────

/**
 * 채팅방에 메시지를 전송합니다. 소유권 확인 포함.
 */
export async function sendMessage(
  chatId: string,
  content: string
): Promise<{
  success: boolean;
  message?: OwnerChatMessage;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "인증이 필요합니다." };
  }

  if (!content.trim()) {
    return { success: false, error: "메시지 내용이 비어있습니다." };
  }

  // 소유권 확인
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      chatType: "OWNER_SUPPORT",
      OR: [
        { userId: session.user.id },
        { adminId: session.user.id },
      ],
    },
  });

  if (!chat) {
    return { success: false, error: "채팅방을 찾을 수 없습니다." };
  }

  try {
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: session.user.id,
        type: "TEXT",
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, nickname: true } },
      },
    });

    // 채팅방 updatedAt 갱신 + 상태 업데이트 (WAITING -> IN_PROGRESS)
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        ...(chat.status === "WAITING" ? { status: "IN_PROGRESS" } : {}),
      },
    });

    return {
      success: true,
      message: {
        id: message.id,
        chatId: message.chatId,
        senderId: message.sender.id,
        nickname: message.sender.nickname,
        type: message.type as "TEXT",
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[sendMessage] Error:", error);
    return { success: false, error: "메시지를 전송하지 못했습니다." };
  }
}

// ─── markAsRead ─────────────────────────────────────────

/**
 * 채팅방의 안 읽은 메시지를 모두 읽음 처리합니다.
 */
export async function markAsRead(
  chatId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 소유권 확인
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      chatType: "OWNER_SUPPORT",
      OR: [
        { userId: session.user.id },
        { adminId: session.user.id },
      ],
    },
  });

  if (!chat) {
    return { success: false, error: "채팅방을 찾을 수 없습니다." };
  }

  try {
    await prisma.message.updateMany({
      where: {
        chatId,
        isRead: false,
        senderId: { not: session.user.id },
      },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error("[markAsRead] Error:", error);
    return { success: false, error: "읽음 처리에 실패했습니다." };
  }
}
