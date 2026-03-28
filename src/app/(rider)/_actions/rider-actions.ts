"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { DeliveryStatus, OrderStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

// ─── 헬퍼 ──────────────────────────────────────────────

async function requireRider() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("로그인이 필요합니다.");
  if (session.user.role !== "RIDER" && session.user.role !== "ADMIN") {
    throw new Error("배달기사 권한이 필요합니다.");
  }
  return session.user;
}

// ─── 온라인/오프라인 토글 ────────────────────────────────

export async function toggleOnlineStatus(): Promise<{
  success?: boolean;
  isOnline?: boolean;
  error?: string;
}> {
  try {
    const user = await requireRider();

    const existing = await prisma.riderLocation.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      const updated = await prisma.riderLocation.update({
        where: { userId: user.id },
        data: { isOnline: !existing.isOnline },
      });
      return { success: true, isOnline: updated.isOnline };
    } else {
      // 위치 정보가 없으면 기본 좌표(0,0)으로 생성
      const created = await prisma.riderLocation.create({
        data: {
          userId: user.id,
          latitude: 0,
          longitude: 0,
          isOnline: true,
        },
      });
      return { success: true, isOnline: created.isOnline };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "오류가 발생했습니다." };
  }
}

// ─── 배달 수락 ──────────────────────────────────────────

export async function acceptDelivery(
  orderId: string
): Promise<{ success?: boolean; deliveryId?: string; error?: string }> {
  try {
    const user = await requireRider();

    // 이미 진행 중인 배달이 있는지 확인
    const activeDelivery = await prisma.delivery.findFirst({
      where: {
        riderId: user.id,
        status: {
          notIn: [DeliveryStatus.DONE, DeliveryStatus.CANCELLED],
        },
      },
    });

    if (activeDelivery) {
      return { error: "이미 진행 중인 배달이 있습니다." };
    }

    // 배달 요청 찾기
    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
    });

    if (!delivery) {
      return { error: "배달 요청을 찾을 수 없습니다." };
    }

    if (delivery.status !== DeliveryStatus.REQUESTED) {
      return { error: "이미 다른 기사가 수락한 배달입니다." };
    }

    // 트랜잭션: 배달 수락 + 주문 상태 변경
    const [updatedDelivery] = await prisma.$transaction([
      prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          riderId: user.id,
          status: DeliveryStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.RIDER_ASSIGNED },
      }),
    ]);

    revalidatePath("/rider");
    revalidatePath("/rider/active");

    return { success: true, deliveryId: updatedDelivery.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "오류가 발생했습니다." };
  }
}

// ─── 배달 상태 변경 ─────────────────────────────────────

const DELIVERY_STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus | null> = {
  [DeliveryStatus.REQUESTED]: DeliveryStatus.ACCEPTED,
  [DeliveryStatus.ACCEPTED]: DeliveryStatus.AT_STORE,
  [DeliveryStatus.AT_STORE]: DeliveryStatus.PICKED_UP,
  [DeliveryStatus.PICKED_UP]: DeliveryStatus.DELIVERING,
  [DeliveryStatus.DELIVERING]: DeliveryStatus.DONE,
  [DeliveryStatus.DONE]: null,
  [DeliveryStatus.CANCELLED]: null,
};

const DELIVERY_TO_ORDER_STATUS: Partial<Record<DeliveryStatus, OrderStatus>> = {
  [DeliveryStatus.PICKED_UP]: OrderStatus.PICKED_UP,
  [DeliveryStatus.DONE]: OrderStatus.DONE,
};

export async function updateDeliveryStatus(
  deliveryId: string,
  newStatus: DeliveryStatus
): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await requireRider();

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      return { error: "배달을 찾을 수 없습니다." };
    }

    if (delivery.riderId !== user.id) {
      return { error: "본인의 배달만 상태를 변경할 수 있습니다." };
    }

    // 상태 전이 검증
    const expectedNext = DELIVERY_STATUS_TRANSITIONS[delivery.status];
    if (expectedNext !== newStatus) {
      return { error: `현재 상태에서 ${newStatus}(으)로 변경할 수 없습니다.` };
    }

    // 배달 완료 시 추가 데이터
    const extraData: Record<string, unknown> = {};
    if (newStatus === DeliveryStatus.PICKED_UP) {
      extraData.pickedUpAt = new Date();
    }
    if (newStatus === DeliveryStatus.DONE) {
      extraData.completedAt = new Date();
    }

    // 트랜잭션: 배달 상태 + 주문 상태 동시 업데이트
    const operations = [
      prisma.delivery.update({
        where: { id: deliveryId },
        data: { status: newStatus, ...extraData },
      }),
    ];

    const orderStatus = DELIVERY_TO_ORDER_STATUS[newStatus];
    if (orderStatus) {
      operations.push(
        prisma.order.update({
          where: { id: delivery.orderId },
          data: { status: orderStatus },
        }) as never
      );
    }

    // 배달 완료 시 기사 프로필 통계 업데이트
    if (newStatus === DeliveryStatus.DONE) {
      operations.push(
        prisma.riderProfile.update({
          where: { userId: user.id },
          data: {
            totalDeliveries: { increment: 1 },
            totalEarnings: { increment: delivery.riderFee },
          },
        }) as never
      );
    }

    await prisma.$transaction(operations);

    revalidatePath("/rider");
    revalidatePath("/rider/active");
    revalidatePath("/rider/history");

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "오류가 발생했습니다." };
  }
}

// ─── 기사 통계 ──────────────────────────────────────────

export type StatsPeriod = "today" | "week" | "month";

export interface RiderStats {
  totalDeliveries: number;
  totalEarnings: number;
}

export async function getRiderStats(
  period: StatsPeriod
): Promise<{ data?: RiderStats; error?: string }> {
  try {
    const user = await requireRider();

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week": {
        const day = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        break;
      }
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const deliveries = await prisma.delivery.findMany({
      where: {
        riderId: user.id,
        status: DeliveryStatus.DONE,
        completedAt: { gte: startDate },
      },
      select: { riderFee: true },
    });

    return {
      data: {
        totalDeliveries: deliveries.length,
        totalEarnings: deliveries.reduce((sum, d) => sum + d.riderFee, 0),
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "오류가 발생했습니다." };
  }
}

// ─── 배달 내역 ──────────────────────────────────────────

export interface DeliveryHistoryItem {
  id: string;
  restaurantName: string;
  deliveryAddress: string;
  distance: number | null;
  riderFee: number;
  completedAt: string;
  status: DeliveryStatus;
}

export async function getDeliveryHistory(
  page: number = 1,
  pageSize: number = 20
): Promise<{
  data?: DeliveryHistoryItem[];
  hasMore?: boolean;
  error?: string;
}> {
  try {
    const user = await requireRider();

    const deliveries = await prisma.delivery.findMany({
      where: {
        riderId: user.id,
        status: { in: [DeliveryStatus.DONE, DeliveryStatus.CANCELLED] },
      },
      include: {
        order: {
          include: {
            restaurant: { select: { name: true } },
          },
        },
      },
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
    });

    const hasMore = deliveries.length > pageSize;
    const items = deliveries.slice(0, pageSize);

    return {
      data: items.map((d) => ({
        id: d.id,
        restaurantName: d.order.restaurant.name,
        deliveryAddress: d.order.deliveryAddress,
        distance: d.distance,
        riderFee: d.riderFee,
        completedAt: (d.completedAt ?? d.updatedAt).toISOString(),
        status: d.status,
      })),
      hasMore,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "오류가 발생했습니다." };
  }
}

// ─── 위치 업데이트 ──────────────────────────────────────

export async function updateRiderLocation(
  latitude: number,
  longitude: number
): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await requireRider();

    await prisma.riderLocation.upsert({
      where: { userId: user.id },
      update: { latitude, longitude },
      create: {
        userId: user.id,
        latitude,
        longitude,
        isOnline: true,
      },
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "오류가 발생했습니다." };
  }
}
