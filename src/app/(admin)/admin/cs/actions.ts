"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { revalidatePath } from "next/cache";
import type { ChatType, ChatStatus } from "@/generated/prisma/client";

// ─── 관리자 권한 확인 ────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session;
}

// ─── Types ──────────────────────────────────────────────

export interface AdminChatListItem {
  id: string;
  chatType: ChatType;
  status: ChatStatus;
  category: string | null;
  orderId: string | null;
  adminId: string | null;
  user: {
    id: string;
    nickname: string;
    image: string | null;
    role: string;
  };
  lastMessage: {
    content: string;
    type: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  nickname: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminChatDetail {
  id: string;
  chatType: ChatType;
  status: ChatStatus;
  category: string | null;
  adminId: string | null;
  user: {
    id: string;
    nickname: string;
    email: string;
    image: string | null;
    role: string;
    createdAt: string;
    _count: {
      orders: number;
      deliveries: number;
    };
  };
  order: {
    id: string;
    status: string;
    totalPrice: number;
    deliveryFee: number;
    deliveryAddress: string;
    createdAt: string;
    restaurant: {
      id: string;
      name: string;
    };
    delivery: {
      id: string;
      status: string;
      rider: {
        id: string;
        nickname: string;
      } | null;
    } | null;
  } | null;
  previousChats: {
    id: string;
    chatType: ChatType;
    status: ChatStatus;
    category: string | null;
    createdAt: string;
  }[];
  createdAt: string;
}

// ─── getChatList: 상담 채팅 목록 ───────────────────────

export interface ChatListParams {
  status?: ChatStatus | "ALL";
  chatType?: ChatType | "ALL";
}

export async function getChatList(params: ChatListParams = {}) {
  await requireAdmin();

  const { status = "ALL", chatType = "ALL" } = params;

  const where: Record<string, unknown> = {};

  if (status !== "ALL") {
    where.status = status;
  }

  if (chatType !== "ALL") {
    where.chatType = chatType;
  }

  const chats = await prisma.chat.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          image: true,
          role: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          type: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: { isRead: false },
          },
        },
      },
    },
    orderBy:
      status === "WAITING"
        ? { createdAt: "asc" } // WAITING은 오래된 순 (먼저 온 상담 먼저)
        : { updatedAt: "desc" }, // 나머지는 최신순
  });

  const items: AdminChatListItem[] = chats.map((chat) => {
    const lastMsg = chat.messages[0] ?? null;
    return {
      id: chat.id,
      chatType: chat.chatType,
      status: chat.status,
      category: chat.category,
      orderId: chat.orderId,
      adminId: chat.adminId,
      user: {
        id: chat.user.id,
        nickname: chat.user.nickname,
        image: chat.user.image,
        role: chat.user.role,
      },
      lastMessage: lastMsg
        ? {
            content:
              lastMsg.type === "IMAGE" ? "사진을 보냈습니다" : lastMsg.content,
            type: lastMsg.type,
            createdAt: lastMsg.createdAt.toISOString(),
          }
        : null,
      unreadCount: chat._count.messages,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    };
  });

  return items;
}

// ─── getChatDetail: 채팅 상세 (상담 정보 패널용) ─────────

export async function getChatDetail(
  chatId: string
): Promise<AdminChatDetail | null> {
  await requireAdmin();

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              deliveries: true,
            },
          },
        },
      },
      order: {
        include: {
          restaurant: {
            select: { id: true, name: true },
          },
          delivery: {
            include: {
              rider: {
                select: { id: true, nickname: true },
              },
            },
          },
        },
      },
    },
  });

  if (!chat) return null;

  // 이전 상담 이력 (같은 userId, 최근 5건, 현재 채팅 제외)
  const previousChats = await prisma.chat.findMany({
    where: {
      userId: chat.userId,
      id: { not: chatId },
    },
    select: {
      id: true,
      chatType: true,
      status: true,
      category: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    id: chat.id,
    chatType: chat.chatType,
    status: chat.status,
    category: chat.category,
    adminId: chat.adminId,
    user: {
      id: chat.user.id,
      nickname: chat.user.nickname,
      email: chat.user.email,
      image: chat.user.image,
      role: chat.user.role,
      createdAt: chat.user.createdAt.toISOString(),
      _count: chat.user._count,
    },
    order: chat.order
      ? {
          id: chat.order.id,
          status: chat.order.status,
          totalPrice: chat.order.totalPrice,
          deliveryFee: chat.order.deliveryFee,
          deliveryAddress: chat.order.deliveryAddress,
          createdAt: chat.order.createdAt.toISOString(),
          restaurant: chat.order.restaurant,
          delivery: chat.order.delivery
            ? {
                id: chat.order.delivery.id,
                status: chat.order.delivery.status,
                rider: chat.order.delivery.rider,
              }
            : null,
        }
      : null,
    previousChats: previousChats.map((c) => ({
      id: c.id,
      chatType: c.chatType,
      status: c.status,
      category: c.category,
      createdAt: c.createdAt.toISOString(),
    })),
    createdAt: chat.createdAt.toISOString(),
  };
}

// ─── getChatMessages: 채팅방 메시지 조회 ─────────────────

export async function getChatMessages(
  chatId: string,
  cursor?: string,
  limit: number = 50
): Promise<{
  success: boolean;
  messages: AdminChatMessage[];
  hasMore: boolean;
  error?: string;
}> {
  await requireAdmin();

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true },
  });

  if (!chat) {
    return {
      success: false,
      messages: [],
      hasMore: false,
      error: "채팅방을 찾을 수 없습니다.",
    };
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
    const messages: AdminChatMessage[] = (
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
    console.error("[admin/cs getChatMessages] Error:", error);
    return {
      success: false,
      messages: [],
      hasMore: false,
      error: "메시지를 불러오지 못했습니다.",
    };
  }
}

// ─── sendMessage: 관리자 메시지 전송 ─────────────────────

export async function sendMessage(
  chatId: string,
  content: string,
  type: "TEXT" | "IMAGE" = "TEXT"
): Promise<{
  success: boolean;
  message?: AdminChatMessage;
  error?: string;
}> {
  const session = await requireAdmin();

  if (!content.trim()) {
    return { success: false, error: "메시지 내용이 비어있습니다." };
  }

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { id: true, status: true, adminId: true },
  });

  if (!chat) {
    return { success: false, error: "채팅방을 찾을 수 없습니다." };
  }

  try {
    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: session.user.id,
        type,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, nickname: true } },
      },
    });

    // 채팅방 상태 업데이트 (WAITING -> IN_PROGRESS) + adminId 배정
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        ...(chat.status === "WAITING" ? { status: "IN_PROGRESS" } : {}),
        ...(!chat.adminId ? { adminId: session.user.id } : {}),
      },
    });

    return {
      success: true,
      message: {
        id: message.id,
        chatId: message.chatId,
        senderId: message.sender.id,
        nickname: message.sender.nickname,
        type: message.type as "TEXT" | "IMAGE",
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[admin/cs sendMessage] Error:", error);
    return { success: false, error: "메시지를 전송하지 못했습니다." };
  }
}

// ─── updateChatStatus: 상담 상태 변경 ────────────────────

export async function updateChatStatus(
  chatId: string,
  newStatus: ChatStatus
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // 상담 완료 시 시스템 메시지 삽입
    if (newStatus === "CLOSED") {
      const session = await auth();
      await prisma.message.create({
        data: {
          chatId,
          senderId: session!.user.id,
          type: "SYSTEM",
          content: "상담이 종료되었습니다.",
        },
      });
    }

    revalidatePath("/admin/cs");
    return { success: true };
  } catch (error) {
    console.error("[admin/cs updateChatStatus] Error:", error);
    return { success: false, error: "상태 변경에 실패했습니다." };
  }
}

// ─── assignChat: 상담원 배정 ─────────────────────────────

export async function assignChat(
  chatId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin();

  try {
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        adminId: session.user.id,
        status: "IN_PROGRESS",
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/cs");
    return { success: true };
  } catch (error) {
    console.error("[admin/cs assignChat] Error:", error);
    return { success: false, error: "상담원 배정에 실패했습니다." };
  }
}

// ─── markAsRead: 읽음 처리 ───────────────────────────────

export async function markAsRead(
  chatId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAdmin();

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
    console.error("[admin/cs markAsRead] Error:", error);
    return { success: false, error: "읽음 처리에 실패했습니다." };
  }
}

// ─── getUnreadCount: 대기중 채팅 건수 ─────────────────────

export async function getUnreadCount(): Promise<number> {
  await requireAdmin();

  return prisma.chat.count({
    where: { status: "WAITING" },
  });
}
