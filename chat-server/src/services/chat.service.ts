import { prisma } from "../lib/prisma.js";

export interface ChatParticipants {
  customerId: string;
  ownerId: string;
}

export async function saveMessage(
  id: string,
  chatId: string,
  senderId: string,
  type: string,
  content: string
): Promise<string> {
  const message = await prisma.message.create({
    data: { id, chatId, senderId, type, content },
  });
  return message.createdAt.toISOString();
}

export async function updateChatTimestamp(chatId: string): Promise<void> {
  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });
}

export async function markMessagesAsRead(
  chatId: string,
  readerId: string
): Promise<number> {
  const result = await prisma.message.updateMany({
    where: {
      chatId,
      senderId: { not: readerId },
      isRead: false,
    },
    data: { isRead: true },
  });
  return result.count;
}

export async function getChatParticipants(
  chatId: string
): Promise<ChatParticipants> {
  const chat = await prisma.chat.findUniqueOrThrow({
    where: { id: chatId },
    include: {
      order: {
        include: {
          restaurant: { select: { ownerId: true } },
        },
      },
    },
  });
  return {
    customerId: chat.userId,
    ownerId: chat.order.restaurant.ownerId,
  };
}
