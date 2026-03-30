"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";

// ─── 관리자 권한 확인 ────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session;
}

// ─── 배달 현황 모니터링 데이터 ──────────────────────────────
export interface ActiveDeliveryItem {
  id: string;
  status: string;
  riderNickname: string | null;
  restaurantName: string;
  customerNickname: string;
  deliveryAddress: string;
  createdAt: string;
}

export interface MonitoringData {
  activeDeliveryCount: number;
  pendingMatchCount: number;
  avgMatchingTimeMinutes: number | null;
  activeDeliveries: ActiveDeliveryItem[];
}

export async function getMonitoringData(): Promise<MonitoringData> {
  await requireAdmin();

  // 활성 배달 상태들 (완료/취소 제외)
  const activeStatuses = [
    "REQUESTED",
    "ACCEPTED",
    "AT_STORE",
    "PICKED_UP",
    "DELIVERING",
  ] as const;

  const [activeDeliveries, pendingMatchCount, recentMatchedDeliveries] =
    await Promise.all([
      // 활성 배달 목록
      prisma.delivery.findMany({
        where: {
          status: { in: [...activeStatuses] },
        },
        include: {
          rider: {
            select: { nickname: true },
          },
          order: {
            select: {
              deliveryAddress: true,
              restaurant: {
                select: { name: true },
              },
              user: {
                select: { nickname: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),

      // 매칭 대기 건수 (REQUESTED 상태 = 아직 기사 미배정)
      prisma.delivery.count({
        where: { status: "REQUESTED" },
      }),

      // 최근 매칭된 배달들로 평균 매칭 시간 계산
      prisma.delivery.findMany({
        where: {
          status: { not: "REQUESTED" },
          acceptedAt: { not: null },
        },
        select: {
          createdAt: true,
          acceptedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

  // 평균 매칭 시간 계산
  const matchedWithTimes = recentMatchedDeliveries.filter(
    (d) => d.acceptedAt
  );
  const avgMatchingTimeMinutes =
    matchedWithTimes.length > 0
      ? Math.round(
          matchedWithTimes.reduce((sum, d) => {
            const diff =
              new Date(d.acceptedAt!).getTime() -
              new Date(d.createdAt).getTime();
            return sum + diff / 60000;
          }, 0) / matchedWithTimes.length
        )
      : null;

  const formattedDeliveries: ActiveDeliveryItem[] = activeDeliveries.map(
    (d) => ({
      id: d.id,
      status: d.status,
      riderNickname: d.rider?.nickname ?? null,
      restaurantName: d.order.restaurant.name,
      customerNickname: d.order.user.nickname,
      deliveryAddress: d.order.deliveryAddress,
      createdAt: d.createdAt.toISOString(),
    })
  );

  return {
    activeDeliveryCount: activeDeliveries.length,
    pendingMatchCount,
    avgMatchingTimeMinutes,
    activeDeliveries: formattedDeliveries,
  };
}
