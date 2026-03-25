"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── 타입 ───────────────────────────────────────────

export interface MenuFormData {
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

export interface MenuWithId extends MenuFormData {
  id: string;
  isSoldOut: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── 헬퍼: 사장님 음식점 ID 조회 ───────────────────

async function getOwnerRestaurantId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("인증이 필요합니다.");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!restaurant) {
    throw new Error("등록된 음식점이 없습니다.");
  }

  return restaurant.id;
}

// ─── 메뉴 목록 조회 ────────────────────────────────

export async function getMenus() {
  const restaurantId = await getOwnerRestaurantId();

  const menus = await prisma.menu.findMany({
    where: { restaurantId },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  return menus;
}

// ─── 메뉴 생성 ─────────────────────────────────────

export async function createMenu(data: MenuFormData) {
  const restaurantId = await getOwnerRestaurantId();

  if (!data.name.trim()) {
    return { error: "메뉴 이름을 입력해주세요." };
  }
  if (!data.category.trim()) {
    return { error: "카테고리를 입력해주세요." };
  }
  if (data.price <= 0) {
    return { error: "가격은 0보다 커야 합니다." };
  }

  const menu = await prisma.menu.create({
    data: {
      restaurantId,
      name: data.name.trim(),
      category: data.category.trim(),
      price: data.price,
      description: data.description?.trim() || null,
      imageUrl: data.imageUrl || null,
    },
  });

  revalidatePath("/owner/menus");
  return { success: true, menu };
}

// ─── 메뉴 수정 ─────────────────────────────────────

export async function updateMenu(menuId: string, data: MenuFormData) {
  const restaurantId = await getOwnerRestaurantId();

  // 해당 메뉴가 사장님의 음식점 소유인지 확인
  const existing = await prisma.menu.findFirst({
    where: { id: menuId, restaurantId },
  });
  if (!existing) {
    return { error: "메뉴를 찾을 수 없습니다." };
  }

  if (!data.name.trim()) {
    return { error: "메뉴 이름을 입력해주세요." };
  }
  if (!data.category.trim()) {
    return { error: "카테고리를 입력해주세요." };
  }
  if (data.price <= 0) {
    return { error: "가격은 0보다 커야 합니다." };
  }

  const menu = await prisma.menu.update({
    where: { id: menuId },
    data: {
      name: data.name.trim(),
      category: data.category.trim(),
      price: data.price,
      description: data.description?.trim() || null,
      imageUrl: data.imageUrl || null,
    },
  });

  revalidatePath("/owner/menus");
  return { success: true, menu };
}

// ─── 메뉴 삭제 ─────────────────────────────────────

export async function deleteMenu(menuId: string) {
  const restaurantId = await getOwnerRestaurantId();

  const existing = await prisma.menu.findFirst({
    where: { id: menuId, restaurantId },
  });
  if (!existing) {
    return { error: "메뉴를 찾을 수 없습니다." };
  }

  // 주문 항목에 연결된 메뉴인지 확인
  const orderItemCount = await prisma.orderItem.count({
    where: { menuId },
  });
  if (orderItemCount > 0) {
    // 주문 이력이 있으면 삭제 대신 품절 처리 권장
    return {
      error:
        "주문 이력이 있는 메뉴는 삭제할 수 없습니다. 품절 처리를 이용해주세요.",
    };
  }

  await prisma.menu.delete({ where: { id: menuId } });

  revalidatePath("/owner/menus");
  return { success: true };
}

// ─── 품절 토글 ─────────────────────────────────────

export async function toggleSoldOut(menuId: string) {
  const restaurantId = await getOwnerRestaurantId();

  const existing = await prisma.menu.findFirst({
    where: { id: menuId, restaurantId },
    select: { id: true, isSoldOut: true },
  });
  if (!existing) {
    return { error: "메뉴를 찾을 수 없습니다." };
  }

  const menu = await prisma.menu.update({
    where: { id: menuId },
    data: { isSoldOut: !existing.isSoldOut },
  });

  revalidatePath("/owner/menus");
  return { success: true, isSoldOut: menu.isSoldOut };
}
