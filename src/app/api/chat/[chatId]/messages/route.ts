import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await params;
  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  // 채팅방 소유자 확인
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId: session.user.id },
  });

  if (!chat) {
    return NextResponse.json({ error: "채팅방을 찾을 수 없습니다." }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
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

  const hasMore = messages.length > limit;
  const items = (hasMore ? messages.slice(0, limit) : messages)
    .reverse()
    .map((m: typeof messages[number]) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.sender.id,
      nickname: m.sender.nickname,
      type: m.type as "TEXT" | "IMAGE",
      content: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    }));

  const nextCursor = hasMore ? items[0]?.createdAt ?? null : null;

  return NextResponse.json({ messages: items, nextCursor });
}
