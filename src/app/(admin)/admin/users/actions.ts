"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role, UserStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

// ─── 관리자 권한 확인 ────────────────────────────────────
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return session;
}

// ─── 유저 목록 조회 ────────────────────────────────────────
export interface UserListParams {
  search?: string;
  role?: Role | "ALL";
  status?: UserStatus | "ALL";
  page?: number;
  pageSize?: number;
}

export interface UserListItem {
  id: string;
  nickname: string;
  email: string;
  image: string | null;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  _count: {
    orders: number;
    sentReports: number;
    receivedReports: number;
  };
}

export async function getUsers(params: UserListParams = {}) {
  await requireAdmin();

  const {
    search = "",
    role = "ALL",
    status = "ALL",
    page = 1,
    pageSize = 20,
  } = params;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { nickname: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role !== "ALL") {
    where.role = role;
  }

  if (status !== "ALL") {
    where.status = status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        nickname: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            sentReports: true,
            receivedReports: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users as UserListItem[],
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
  };
}

// ─── 유저 상세 조회 ────────────────────────────────────────
export async function getUserDetail(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          restaurant: {
            select: { id: true, name: true },
          },
          items: {
            include: {
              menu: { select: { name: true } },
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
      restaurant: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          orders: true,
          reviews: true,
          sentReports: true,
          receivedReports: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("유저를 찾을 수 없습니다.");
  }

  return user;
}

// ─── 유저 상태 변경 (정지/차단/해제) ────────────────────────
export async function updateUserStatus(
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

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch {
    return { success: false, error: "유저 상태 변경에 실패했습니다." };
  }
}

// ─── 유저 역할 변경 ────────────────────────────────────────
export async function updateUserRole(
  userId: string,
  newRole: Role
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    return { success: true };
  } catch {
    return { success: false, error: "유저 역할 변경에 실패했습니다." };
  }
}
