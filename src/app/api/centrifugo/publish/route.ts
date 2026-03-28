import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { publish } from "@/shared/api/centrifugo";
import { randomUUID } from "crypto";

/**
 * Centrifugo Publish Proxy
 * - chat:<chatId> 채널 → 메시지 저장 + 브로드캐스트
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.user as string;
    const channel = body.channel as string;
    const data = body.data as { type: string; content: string; _tempId?: string };

    // chat:<chatId> 채널만 처리
    if (!channel.startsWith("chat:")) {
      return NextResponse.json({
        error: { code: 400, message: "Publish not allowed on this channel" },
      });
    }

    const chatId = channel.replace("chat:", "");

    // 참여자 검증
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [{ userId }, { adminId: userId }],
      },
    });

    if (!chat) {
      return NextResponse.json({
        error: { code: 403, message: "Not a chat participant" },
      });
    }

    // 메시지 저장
    const messageId = randomUUID();
    const message = await prisma.message.create({
      data: {
        id: messageId,
        chatId,
        senderId: userId,
        type: data.type || "TEXT",
        content: data.content,
      },
      include: { sender: { select: { nickname: true } } },
    });

    // 채팅 타임스탬프 갱신
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    const enrichedMessage = {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      nickname: message.sender.nickname,
      type: message.type,
      content: message.content,
      isRead: false,
      createdAt: message.createdAt.toISOString(),
      _tempId: data._tempId,
    };

    // 수신자 개인 채널에도 알림 발행 (채팅 목록 갱신용)
    const recipientId = chat.userId === userId ? chat.adminId : chat.userId;
    if (recipientId) {
      await publish(`user#${recipientId}`, {
        ...enrichedMessage,
        type: "message:new",
      });
    }

    return NextResponse.json({
      result: { data: enrichedMessage },
    });
  } catch {
    return NextResponse.json({
      error: { code: 500, message: "Internal error" },
    });
  }
}
