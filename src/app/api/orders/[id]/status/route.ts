import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { publishOrderUpdate } from "@/lib/redis";
import { OrderStatus } from "@/generated/prisma/client";

/** 허용되는 상태 전이 맵 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.COOKING, OrderStatus.CANCELLED],
  COOKING: [OrderStatus.PICKED_UP],
  PICKED_UP: [OrderStatus.DONE],
  DONE: [],
  CANCELLED: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { id: orderId } = await params;

  const body = await request.json();
  const newStatus = body.status as OrderStatus | undefined;

  if (!newStatus || !Object.values(OrderStatus).includes(newStatus)) {
    return NextResponse.json(
      { error: "유효하지 않은 상태입니다." },
      { status: 400 }
    );
  }

  // 주문 조회 + 사장 소유 음식점 검증
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { restaurant: { select: { ownerId: true } } },
  });

  if (!order) {
    return NextResponse.json(
      { error: "주문을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // ADMIN은 소유권 검증 생략
  if (session.user.role === "OWNER" && order.restaurant.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "해당 주문에 대한 권한이 없습니다." },
      { status: 403 }
    );
  }

  // 상태 전이 유효성 검사
  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `${order.status} → ${newStatus} 상태 전이는 허용되지 않습니다.`,
      },
      { status: 400 }
    );
  }

  // DB 업데이트
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: {
      items: { include: { menu: { select: { name: true } } } },
      restaurant: { select: { name: true } },
    },
  });

  // Redis Stream 발행
  await publishOrderUpdate(orderId, newStatus, order.userId);

  return NextResponse.json(updatedOrder);
}
