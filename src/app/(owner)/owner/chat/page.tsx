import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { OwnerChatList } from "./_components/owner-chat-list";
import type { ChatListItem } from "@/hooks/useChatList";

export const metadata = { title: "고객 채팅 - B-Delivery" };

export default async function OwnerChatListPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // 사장의 음식점 조회
  const restaurant = await prisma.restaurant.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <MessageCircle className="size-12 mb-3" />
        <p className="text-sm">등록된 음식점이 없습니다.</p>
      </div>
    );
  }

  // 음식점 주문에 연결된 채팅 목록 조회
  const chats = await prisma.chat.findMany({
    where: {
      order: { restaurantId: restaurant.id },
    },
    include: {
      user: { select: { nickname: true, image: true } },
      order: { select: { id: true, totalPrice: true, createdAt: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, type: true, createdAt: true, senderId: true, isRead: true },
      },
      _count: {
        select: {
          messages: {
            where: { isRead: false, senderId: { not: session.user.id } },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <MessageCircle className="size-12 mb-3" />
        <p className="text-sm">아직 채팅이 없습니다.</p>
        <p className="text-xs mt-1">고객이 문의를 시작하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  const initialChats: ChatListItem[] = chats.map((chat) => ({
    id: chat.id,
    user: chat.user,
    order: chat.order
      ? {
          id: chat.order.id,
          totalPrice: chat.order.totalPrice,
          createdAt: chat.order.createdAt.toISOString(),
        }
      : null,
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
  }));

  return <OwnerChatList initialChats={initialChats} />;
}
