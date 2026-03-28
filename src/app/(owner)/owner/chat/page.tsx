import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OwnerChatPage } from "./_components/owner-chat-page";
import type { OwnerChatItem } from "./_actions/chat-actions";

export const metadata = { title: "고객센터 상담 - B-Delivery" };

export default async function OwnerChatListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // OWNER_SUPPORT 타입 채팅 목록 조회
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

  const initialChats: OwnerChatItem[] = chats.map((chat) => ({
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

  return (
    <OwnerChatPage
      initialChats={initialChats}
      currentUserId={session.user.id}
    />
  );
}
