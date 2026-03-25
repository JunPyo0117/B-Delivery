import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatRoom } from "./_components/ChatRoom";

const INITIAL_MSG_LIMIT = 50;

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { chatId } = await params;

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: session.user.id },
    include: {
      order: {
        include: { restaurant: { select: { name: true } } },
      },
    },
  });

  if (!chat) notFound();

  // 초기 메시지 로드
  const rawMessages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: INITIAL_MSG_LIMIT + 1,
    include: {
      sender: { select: { id: true, nickname: true } },
    },
  });

  const hasMore = rawMessages.length > INITIAL_MSG_LIMIT;
  const messages = (hasMore ? rawMessages.slice(0, INITIAL_MSG_LIMIT) : rawMessages)
    .reverse()
    .map((m: typeof rawMessages[number]) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.sender.id,
      nickname: m.sender.nickname,
      type: m.type as "TEXT" | "IMAGE",
      content: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    }));

  return (
    <ChatRoom
      chatId={chatId}
      currentUserId={session.user.id}
      restaurantName={chat.order.restaurant.name}
      initialMessages={messages}
      hasMore={hasMore}
    />
  );
}
