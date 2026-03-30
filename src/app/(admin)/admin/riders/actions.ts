"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import type { UserStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

// ─── 관리자 권한 확인 ────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session;
}

// ─── 기사 목록 조회 ────────────────────────────────────────
export interface RiderListParams {
  search?: string;
  onlineFilter?: "ALL" | "ONLINE" | "OFFLINE";
  page?: number;
  pageSize?: number;
}

export interface RiderListItem {
  id: string;
  nickname: string;
  image: string | null;
  status: UserStatus;
  transportType: string;
  isOnline: boolean;
  totalDeliveries: number;
  avgDeliveryTime: number | null;
}

export async function getRiders(params: RiderListParams = {}) {
  await requireAdmin();

  const {
    search = "",
    onlineFilter = "ALL",
    page = 1,
    pageSize = 20,
  } = params;

  // RiderProfile을 기준으로 조회 (JOIN User, RiderLocation)
  const where: Record<string, unknown> = {};

  if (search) {
    where.user = {
      nickname: { contains: search, mode: "insensitive" },
    };
  }

  if (onlineFilter !== "ALL") {
    where.user = {
      ...(where.user as Record<string, unknown> | undefined),
      riderLocation: {
        isOnline: onlineFilter === "ONLINE",
      },
    };
  }

  const [profiles, total] = await Promise.all([
    prisma.riderProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            image: true,
            status: true,
            riderLocation: {
              select: { isOnline: true },
            },
            deliveries: {
              where: { status: "DONE" },
              select: {
                acceptedAt: true,
                completedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.riderProfile.count({ where }),
  ]);

  const riders: RiderListItem[] = profiles.map((profile) => {
    const doneDeliveries = profile.user.deliveries.filter(
      (d) => d.acceptedAt && d.completedAt
    );
    const avgTime =
      doneDeliveries.length > 0
        ? Math.round(
            doneDeliveries.reduce((sum, d) => {
              const diff =
                new Date(d.completedAt!).getTime() -
                new Date(d.acceptedAt!).getTime();
              return sum + diff / 60000; // 분 단위
            }, 0) / doneDeliveries.length
          )
        : null;

    return {
      id: profile.user.id,
      nickname: profile.user.nickname,
      image: profile.user.image,
      status: profile.user.status,
      transportType: profile.transportType,
      isOnline: profile.user.riderLocation?.isOnline ?? false,
      totalDeliveries: profile.totalDeliveries,
      avgDeliveryTime: avgTime,
    };
  });

  return {
    riders,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
}

// ─── 기사 상세 조회 ────────────────────────────────────────
export async function getRiderDetail(riderId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: riderId },
    include: {
      riderProfile: true,
      riderLocation: true,
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          order: {
            select: {
              id: true,
              deliveryAddress: true,
              totalPrice: true,
              restaurant: {
                select: { name: true },
              },
              user: {
                select: { nickname: true },
              },
            },
          },
        },
      },
      receivedReports: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          reporter: { select: { nickname: true } },
        },
      },
      _count: {
        select: {
          deliveries: true,
          receivedReports: true,
        },
      },
    },
  });

  if (!user || !user.riderProfile) {
    throw new Error("배달기사를 찾을 수 없습니다.");
  }

  // 완료된 배달들로 평균 배달 시간 계산
  const doneDeliveries = await prisma.delivery.findMany({
    where: {
      riderId: riderId,
      status: "DONE",
      acceptedAt: { not: null },
      completedAt: { not: null },
    },
    select: {
      acceptedAt: true,
      completedAt: true,
    },
  });

  const avgDeliveryTime =
    doneDeliveries.length > 0
      ? Math.round(
          doneDeliveries.reduce((sum, d) => {
            const diff =
              new Date(d.completedAt!).getTime() -
              new Date(d.acceptedAt!).getTime();
            return sum + diff / 60000;
          }, 0) / doneDeliveries.length
        )
      : null;

  return {
    ...user,
    avgDeliveryTime,
  };
}

// ─── 기사 상태 변경 (정지/해제) ────────────────────────────
export async function updateRiderStatus(
  userId: string,
  newStatus: UserStatus
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: newStatus,
        bannedAt: newStatus === "BANNED" ? new Date() : null,
      },
    });

    revalidatePath("/admin/riders");
    revalidatePath(`/admin/riders/${userId}`);

    return { success: true };
  } catch {
    return { success: false, error: "기사 상태 변경에 실패했습니다." };
  }
}
