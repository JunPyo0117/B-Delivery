import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, targetUserId } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  // 주문이 현재 사용자의 것이거나 사장의 음식점 주문인지 확인 (ADMIN은 모든 주문 접근 가능)
  const isAdmin = session.user.role === "ADMIN";
  const order = await prisma.order.findFirst({
    where: isAdmin
      ? { id: orderId }
      : {
          id: orderId,
          OR: [
            { userId: session.user.id },
            { restaurant: { ownerId: session.user.id } },
          ],
        },
    include: { chats: { select: { id: true }, take: 1 } },
  });

  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  // ADMIN이 대상 사용자를 지정하여 채팅을 여는 경우
  if (isAdmin && targetUserId) {
    // 해당 대상과의 기존 채팅이 있으면 반환
    const existingChat = await prisma.chat.findFirst({
      where: { orderId, userId: targetUserId },
      select: { id: true },
    });
    if (existingChat) {
      return NextResponse.json({ chatId: existingChat.id });
    }
    // 대상 사용자의 역할로 chatType 결정
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "대상 사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const chatType = targetUser.role === "OWNER" ? "OWNER_SUPPORT" : targetUser.role === "RIDER" ? "RIDER_SUPPORT" : "CUSTOMER_SUPPORT";

    const chat = await prisma.chat.create({
      data: {
        orderId,
        userId: targetUserId,
        chatType,
        adminId: session.user.id,
        status: "IN_PROGRESS",
      },
    });

    await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: session.user.id,
        type: "SYSTEM",
        content: "상담원이 연결되었습니다. 무엇을 도와드릴까요?",
      },
    });

    return NextResponse.json({ chatId: chat.id }, { status: 201 });
  }

  // 일반 사용자: 자기 채팅이 이미 있으면 반환
  const existingChat = await prisma.chat.findFirst({
    where: { orderId, userId: session.user.id },
    select: { id: true },
  });
  if (existingChat) {
    return NextResponse.json({ chatId: existingChat.id });
  }

  const role = session.user.role;
  const chatType = role === "OWNER" ? "OWNER_SUPPORT" : role === "RIDER" ? "RIDER_SUPPORT" : "CUSTOMER_SUPPORT";

  // 대기 중인 ADMIN 자동 배정 (가장 최근 활동한 ADMIN)
  const availableAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN", status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const chat = await prisma.chat.create({
    data: {
      orderId,
      userId: session.user.id,
      chatType,
      adminId: availableAdmin?.id || null,
      status: availableAdmin ? "IN_PROGRESS" : "WAITING",
    },
  });

  if (!availableAdmin) {
    await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: session.user.id,
        type: "SYSTEM",
        content: "현재 상담 대기 중입니다. 순서대로 연결해 드릴게요.",
      },
    });
  } else {
    await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: availableAdmin.id,
        type: "SYSTEM",
        content: "상담원이 배정되었습니다. 무엇을 도와드릴까요?",
      },
    });
  }

  return NextResponse.json({ chatId: chat.id }, { status: 201 });
}
