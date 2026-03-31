import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { publishOrderUpdate } from "@/shared/api/redis";
import { OrderStatus } from "@/generated/prisma/client";

/** 허용되는 상태 전이 맵 (PRD 준수) */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.COOKING, OrderStatus.CANCELLED],
  COOKING: [OrderStatus.WAITING_RIDER, OrderStatus.CANCELLED],
  WAITING_RIDER: [OrderStatus.RIDER_ASSIGNED, OrderStatus.COOKING],
  RIDER_ASSIGNED: [OrderStatus.WAITING_RIDER, OrderStatus.PICKED_UP],
  PICKED_UP: [OrderStatus.DONE],
  DONE: [],
  CANCELLED: [],
};

/** USER(고객)가 취소할 수 있는 상태 */
const USER_CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.COOKING,
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
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

  const userRole = session.user.role;
  const userId = session.user.id;

  // 역할별 권한 검증
  if (userRole === "USER") {
    // 고객은 본인 주문만, CANCELLED로만 전이 가능
    if (order.userId !== userId) {
      return NextResponse.json(
        { error: "해당 주문에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }
    if (newStatus !== OrderStatus.CANCELLED) {
      return NextResponse.json(
        { error: "고객은 주문 취소만 가능합니다." },
        { status: 403 }
      );
    }
    if (!USER_CANCELLABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: `현재 상태(${order.status})에서는 취소할 수 없습니다.` },
        { status: 400 }
      );
    }
  } else if (userRole === "OWNER") {
    // 사장은 본인 음식점 주문만
    if (order.restaurant.ownerId !== userId) {
      return NextResponse.json(
        { error: "해당 주문에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }
  } else if (userRole !== "ADMIN" && userRole !== "RIDER") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 상태 전이 유효성 검사
  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `${order.status} → ${newStatus} 상태 전이는 허용되지 않습니다.`,
      },
      { status: 400 }
    );
  }

  // DB 업데이트 — 낙관적 잠금 (현재 상태 조건)
  const updateResult = await prisma.order.updateMany({
    where: { id: orderId, status: order.status },
    data: { status: newStatus },
  });

  if (updateResult.count === 0) {
    return NextResponse.json(
      { error: "주문 상태가 이미 변경되었습니다. 새로고침 후 다시 시도해주세요." },
      { status: 409 }
    );
  }

  const updatedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { menu: { select: { name: true } } } },
      restaurant: { select: { name: true } },
    },
  });

  // Redis Stream 발행 — 고객 + 사장 실시간 알림
  await publishOrderUpdate(orderId, newStatus, order.userId, order.restaurant.ownerId);

  return NextResponse.json(updatedOrder);
}
