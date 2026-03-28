import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { ChatRoomPage } from "@/pages/chat";

const INITIAL_MSG_LIMIT = 50;

export default async function ChatRoomRoute({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { chatId } = await params;

  // 고객 또는 해당 음식점 사장이면 접근 가능
  let chat;
  try {
    chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [
          { userId: session.user.id },
          { order: { restaurant: { ownerId: session.user.id } } },
        ],
      },
      include: {
        order: {
          include: { restaurant: { select: { name: true } } },
        },
      },
    });
  } catch (e) {
    console.error("[ChatRoom] Prisma query error:", e);
    notFound();
  }

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
    .map((m: (typeof rawMessages)[number]) => ({
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
    <ChatRoomPage
      chatId={chatId}
      currentUserId={session.user.id}
      restaurantName={chat.order?.restaurant.name ?? "일반 문의"}
      orderId={chat.order?.id}
      initialMessages={messages}
      hasMore={hasMore}
    />
  );
}
