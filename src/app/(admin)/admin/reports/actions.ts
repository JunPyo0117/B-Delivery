"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { ReportStatus, ReportTarget } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

// ─── 관리자 권한 확인 ────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session;
}

// ─── 신고 목록 조회 ────────────────────────────────────────
export interface ReportListParams {
  targetType?: ReportTarget | "ALL";
  status?: ReportStatus | "ALL";
  page?: number;
  pageSize?: number;
}

export interface ReportListItem {
  id: string;
  reporterId: string;
  reporter: { nickname: string; email: string };
  targetType: ReportTarget;
  targetUserId: string | null;
  targetUser: { nickname: string } | null;
  targetRestaurantId: string | null;
  targetRestaurant: { name: string } | null;
  targetMenuId: string | null;
  targetMenu: { name: string } | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  adminMemo: string | null;
  createdAt: Date;
}

export async function getReports(params: ReportListParams = {}) {
  await requireAdmin();

  const {
    targetType = "ALL",
    status = "ALL",
    page = 1,
    pageSize = 20,
  } = params;

  const where: Record<string, unknown> = {};

  if (targetType !== "ALL") {
    where.targetType = targetType;
  }

  if (status !== "ALL") {
    where.status = status;
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        reporter: { select: { nickname: true, email: true } },
        targetUser: { select: { nickname: true } },
        targetRestaurant: { select: { name: true } },
        targetMenu: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports: reports as ReportListItem[],
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
}

// ─── 신고 상세 조회 ────────────────────────────────────────
export async function getReportDetail(reportId: string) {
  await requireAdmin();

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: {
        select: { id: true, nickname: true, email: true, status: true },
      },
      targetUser: {
        select: {
          id: true,
          nickname: true,
          email: true,
          status: true,
          _count: { select: { receivedReports: true } },
        },
      },
      targetRestaurant: {
        select: { id: true, name: true, isOpen: true },
      },
      targetMenu: {
        select: { id: true, name: true, isSoldOut: true, restaurantId: true },
      },
    },
  });

  if (!report) {
    throw new Error("신고를 찾을 수 없습니다.");
  }

  return report;
}

// ─── 신고 처리: 기각 ────────────────────────────────────────
export async function rejectReport(
  reportId: string,
  adminMemo?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: "REJECTED",
        adminMemo: adminMemo || "기각 처리됨",
      },
    });

    revalidatePath("/admin/reports");
    return { success: true };
  } catch {
    return { success: false, error: "신고 기각 처리에 실패했습니다." };
  }
}

// ─── 신고 처리: 유저 정지 ───────────────────────────────────
export async function resolveReportWithBan(
  reportId: string,
  targetUserId: string,
  adminMemo?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: {
          status: "RESOLVED",
          adminMemo: adminMemo || "회원 정지 처리됨",
        },
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          status: "BANNED",
          bannedAt: new Date(),
        },
      }),
    ]);

    revalidatePath("/admin/reports");
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "신고 처리에 실패했습니다." };
  }
}

// ─── 신고 처리: 음식점 숨김 ─────────────────────────────────
export async function resolveReportWithHideRestaurant(
  reportId: string,
  restaurantId: string,
  adminMemo?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: {
          status: "RESOLVED",
          adminMemo: adminMemo || "음식점 비공개 처리됨",
        },
      }),
      prisma.restaurant.update({
        where: { id: restaurantId },
        data: { isOpen: false },
      }),
    ]);

    revalidatePath("/admin/reports");
    return { success: true };
  } catch {
    return { success: false, error: "음식점 숨김 처리에 실패했습니다." };
  }
}

// ─── 신고 처리: 메뉴 숨김 ───────────────────────────────────
export async function resolveReportWithHideMenu(
  reportId: string,
  menuId: string,
  adminMemo?: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: {
          status: "RESOLVED",
          adminMemo: adminMemo || "메뉴 품절 처리됨",
        },
      }),
      prisma.menu.update({
        where: { id: menuId },
        data: { isSoldOut: true },
      }),
    ]);

    revalidatePath("/admin/reports");
    return { success: true };
  } catch {
    return { success: false, error: "메뉴 숨김 처리에 실패했습니다." };
  }
}
