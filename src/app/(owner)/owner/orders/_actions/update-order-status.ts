"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { publishOrderUpdate, publishDeliveryRequest } from "@/shared/api/redis";
import { OrderStatus } from "@/generated/prisma/client";

/** 허용되는 상태 전이 맵 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.COOKING, OrderStatus.CANCELLED],
  COOKING: [OrderStatus.WAITING_RIDER, OrderStatus.CANCELLED],
  WAITING_RIDER: [OrderStatus.RIDER_ASSIGNED, OrderStatus.COOKING],
  RIDER_ASSIGNED: [OrderStatus.PICKED_UP, OrderStatus.WAITING_RIDER],
  PICKED_UP: [OrderStatus.DONE],
  DONE: [],
  CANCELLED: [],
};

/**
 * 주문 상태를 변경하는 Server Action
 * DB 업데이트 + Redis Stream 이벤트 발행
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  cancelReason?: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return { success: false, error: "권한이 없습니다." };
  }

  // 주문 조회 + 음식점 정보 (배달 요청 시 좌표 필요)
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: {
        select: { ownerId: true, name: true, latitude: true, longitude: true },
      },
    },
  });

  if (!order) {
    return { success: false, error: "주문을 찾을 수 없습니다." };
  }

  // ADMIN은 소유권 검증 생략
  if (
    session.user.role === "OWNER" &&
    order.restaurant.ownerId !== session.user.id
  ) {
    return { success: false, error: "해당 주문에 대한 권한이 없습니다." };
  }

  // 상태 전이 유효성 검사
  const allowed = VALID_TRANSITIONS[order.status];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `${order.status} → ${newStatus} 상태 전이는 허용되지 않습니다.`,
    };
  }

  // DB 업데이트
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      ...(newStatus === OrderStatus.CANCELLED && {
        cancelReason,
        cancelledBy: session.user.role,
      }),
    },
  });

  // WAITING_RIDER 전이 시: Delivery 생성 + 배달 요청 발행
  if (newStatus === OrderStatus.WAITING_RIDER) {
    await prisma.delivery.create({
      data: {
        orderId,
        status: "REQUESTED",
        pickupLat: order.restaurant.latitude,
        pickupLng: order.restaurant.longitude,
        dropoffLat: order.deliveryLat ?? 0,
        dropoffLng: order.deliveryLng ?? 0,
        riderFee: order.deliveryFee,
      },
    });

    await publishDeliveryRequest(
      orderId,
      order.restaurant.latitude,
      order.restaurant.longitude,
      order.deliveryLat ?? 0,
      order.deliveryLng ?? 0,
      order.restaurant.name,
      order.deliveryFee
    );
  }

  // Redis Stream 발행 — 고객 + 사장 실시간 알림
  await publishOrderUpdate(orderId, newStatus, order.userId, order.restaurant.ownerId);

  return { success: true };
}
