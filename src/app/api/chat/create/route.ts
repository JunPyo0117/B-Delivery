import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  // 주문이 현재 사용자의 것이거나 사장의 음식점 주문인지 확인
  const order = await prisma.order.findFirst({
    where: {
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

  // 이미 채팅방이 있으면 반환
  if (order.chats.length > 0) {
    return NextResponse.json({ chatId: order.chats[0].id });
  }

  // 역할별 chatType 결정
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

  // ADMIN 부재 시 시스템 메시지 생성
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
