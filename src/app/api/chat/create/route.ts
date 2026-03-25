import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  // 주문이 현재 사용자의 것인지 확인
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: { chat: { select: { id: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  }

  // 이미 채팅방이 있으면 반환
  if (order.chat) {
    return NextResponse.json({ chatId: order.chat.id });
  }

  // 새 채팅방 생성
  const chat = await prisma.chat.create({
    data: {
      orderId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ chatId: chat.id }, { status: 201 });
}
