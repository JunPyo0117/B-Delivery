"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";

// ─── 타입 ───────────────────────────────────────────

export interface MenuFormData {
  name: string;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  isPopular?: boolean;
  isNew?: boolean;
}

export interface MenuWithId extends MenuFormData {
  id: string;
  isSoldOut: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** 옵션 그룹 입력 데이터 (생성/수정 공용) */
export interface OptionGroupData {
  id?: string; // 수정 시 기존 그룹 ID
  name: string;
  isRequired: boolean;
  maxSelect: number;
  sortOrder: number;
  options: {
    id?: string; // 수정 시 기존 옵션 ID
    name: string;
    extraPrice: number;
    sortOrder: number;
  }[];
}

/** 메뉴 + 옵션그룹 + 옵션 포함 타입 */
export type MenuWithOptions = Prisma.MenuGetPayload<{
  include: {
    optionGroups: {
      include: { options: true };
    };
  };
}>;

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

export async function getMenus(): Promise<MenuWithOptions[]> {
  const restaurantId = await getOwnerRestaurantId();

  const menus = await prisma.menu.findMany({
    where: { restaurantId },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
    include: {
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
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

// ─── 메뉴 + 옵션 그룹 생성 ──────────────────────────

export async function createMenuWithOptions(
  data: MenuFormData,
  optionGroups: OptionGroupData[]
) {
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
      isPopular: data.isPopular ?? false,
      isNew: data.isNew ?? false,
      optionGroups: {
        create: optionGroups.map((g) => ({
          name: g.name.trim(),
          isRequired: g.isRequired,
          maxSelect: g.maxSelect,
          sortOrder: g.sortOrder,
          options: {
            create: g.options.map((o) => ({
              name: o.name.trim(),
              extraPrice: o.extraPrice,
              sortOrder: o.sortOrder,
            })),
          },
        })),
      },
    },
    include: {
      optionGroups: {
        include: { options: true },
      },
    },
  });

  revalidatePath("/owner/menus");
  return { success: true, menu };
}

// ─── 메뉴 + 옵션 그룹 수정 ──────────────────────────

export async function updateMenuWithOptions(
  menuId: string,
  data: MenuFormData,
  optionGroups: OptionGroupData[]
) {
  const restaurantId = await getOwnerRestaurantId();

  // 해당 메뉴가 사장님의 음식점 소유인지 확인
  const existing = await prisma.menu.findFirst({
    where: { id: menuId, restaurantId },
    include: {
      optionGroups: {
        include: { options: true },
      },
    },
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

  // 트랜잭션: 메뉴 업데이트 + 옵션 그룹 upsert/delete
  const menu = await prisma.$transaction(async (tx) => {
    // 1. 메뉴 기본 정보 업데이트
    await tx.menu.update({
      where: { id: menuId },
      data: {
        name: data.name.trim(),
        category: data.category.trim(),
        price: data.price,
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl || null,
        isPopular: data.isPopular ?? false,
        isNew: data.isNew ?? false,
      },
    });

    // 2. 삭제된 옵션 그룹 제거 (클라이언트에서 보내지 않은 기존 그룹)
    const incomingGroupIds = optionGroups
      .map((g) => g.id)
      .filter((id): id is string => !!id);
    const existingGroupIds = existing.optionGroups.map((g) => g.id);
    const deletedGroupIds = existingGroupIds.filter(
      (id) => !incomingGroupIds.includes(id)
    );

    if (deletedGroupIds.length > 0) {
      // MenuOption은 onDelete: Cascade로 자동 삭제
      await tx.menuOptionGroup.deleteMany({
        where: { id: { in: deletedGroupIds } },
      });
    }

    // 3. 각 옵션 그룹 upsert
    for (const group of optionGroups) {
      if (group.id) {
        // 기존 그룹 업데이트
        await tx.menuOptionGroup.update({
          where: { id: group.id },
          data: {
            name: group.name.trim(),
            isRequired: group.isRequired,
            maxSelect: group.maxSelect,
            sortOrder: group.sortOrder,
          },
        });

        // 삭제된 옵션 제거
        const incomingOptionIds = group.options
          .map((o) => o.id)
          .filter((id): id is string => !!id);
        const existingGroup = existing.optionGroups.find(
          (eg) => eg.id === group.id
        );
        const existingOptionIds = existingGroup?.options.map((o) => o.id) ?? [];
        const deletedOptionIds = existingOptionIds.filter(
          (id) => !incomingOptionIds.includes(id)
        );

        if (deletedOptionIds.length > 0) {
          await tx.menuOption.deleteMany({
            where: { id: { in: deletedOptionIds } },
          });
        }

        // 각 옵션 upsert
        for (const option of group.options) {
          if (option.id) {
            await tx.menuOption.update({
              where: { id: option.id },
              data: {
                name: option.name.trim(),
                extraPrice: option.extraPrice,
                sortOrder: option.sortOrder,
              },
            });
          } else {
            await tx.menuOption.create({
              data: {
                groupId: group.id,
                name: option.name.trim(),
                extraPrice: option.extraPrice,
                sortOrder: option.sortOrder,
              },
            });
          }
        }
      } else {
        // 새 그룹 생성
        await tx.menuOptionGroup.create({
          data: {
            menuId,
            name: group.name.trim(),
            isRequired: group.isRequired,
            maxSelect: group.maxSelect,
            sortOrder: group.sortOrder,
            options: {
              create: group.options.map((o) => ({
                name: o.name.trim(),
                extraPrice: o.extraPrice,
                sortOrder: o.sortOrder,
              })),
            },
          },
        });
      }
    }

    // 4. 최종 결과 반환
    return tx.menu.findUniqueOrThrow({
      where: { id: menuId },
      include: {
        optionGroups: {
          orderBy: { sortOrder: "asc" },
          include: {
            options: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
  });

  revalidatePath("/owner/menus");
  return { success: true, menu };
}
