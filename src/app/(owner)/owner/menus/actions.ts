"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { revalidatePath } from "next/cache";
import { MENU_TEMPLATES } from "./menu-templates";

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

export interface OptionData {
  id?: string;
  name: string;
  extraPrice: number;
  sortOrder: number;
}

export interface OptionGroupData {
  id?: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  sortOrder: number;
  options: OptionData[];
}

export interface MenuWithOptions {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isSoldOut: boolean;
  isPopular: boolean;
  isNew: boolean;
  createdAt: Date;
  updatedAt: Date;
  optionGroups: {
    id: string;
    name: string;
    isRequired: boolean;
    maxSelect: number;
    sortOrder: number;
    options: {
      id: string;
      name: string;
      extraPrice: number;
      sortOrder: number;
    }[];
  }[];
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

// ─── 메뉴 목록 조회 (옵션 그룹 포함) ────────────────

export async function getMenus(): Promise<MenuWithOptions[]> {
  const restaurantId = await getOwnerRestaurantId();

  const menus = await prisma.menu.findMany({
    where: { restaurantId },
    include: {
      optionGroups: {
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  return menus;
}

// ─── 메뉴 생성 (옵션 없이) ─────────────────────────

export async function createMenu(data: MenuFormData) {
  return createMenuWithOptions(data, []);
}

// ─── 메뉴 수정 (옵션 없이) ─────────────────────────

export async function updateMenu(menuId: string, data: MenuFormData) {
  return updateMenuWithOptions(menuId, data, []);
}

// ─── 메뉴 + 옵션 그룹 생성 (트랜잭션) ──────────────

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

  const menu = await prisma.$transaction(async (tx) => {
    const created = await tx.menu.create({
      data: {
        restaurantId,
        name: data.name.trim(),
        category: data.category.trim(),
        price: data.price,
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl || null,
        isPopular: data.isPopular ?? false,
        isNew: data.isNew ?? false,
      },
    });

    for (const group of optionGroups) {
      await tx.menuOptionGroup.create({
        data: {
          menuId: created.id,
          name: group.name.trim(),
          isRequired: group.isRequired,
          maxSelect: group.maxSelect,
          sortOrder: group.sortOrder,
          options: {
            create: group.options.map((opt) => ({
              name: opt.name.trim(),
              extraPrice: opt.extraPrice,
              sortOrder: opt.sortOrder,
            })),
          },
        },
      });
    }

    return created;
  });

  revalidatePath("/owner/menus");
  return { success: true, menu };
}

// ─── 메뉴 + 옵션 그룹 수정 (트랜잭션) ──────────────

export async function updateMenuWithOptions(
  menuId: string,
  data: MenuFormData,
  optionGroups: OptionGroupData[]
) {
  const restaurantId = await getOwnerRestaurantId();

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

  const menu = await prisma.$transaction(async (tx) => {
    // 메뉴 기본 정보 업데이트
    const updated = await tx.menu.update({
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

    // 기존 옵션 그룹 ID 목록
    const existingGroups = await tx.menuOptionGroup.findMany({
      where: { menuId },
      select: { id: true },
    });
    const existingGroupIds = new Set(existingGroups.map((g) => g.id));
    const incomingGroupIds = new Set(
      optionGroups.filter((g) => g.id).map((g) => g.id!)
    );

    // 삭제된 그룹 제거 (cascade로 옵션도 함께 삭제)
    for (const gId of existingGroupIds) {
      if (!incomingGroupIds.has(gId)) {
        await tx.menuOptionGroup.delete({ where: { id: gId } });
      }
    }

    // 그룹 upsert
    for (const group of optionGroups) {
      if (group.id && existingGroupIds.has(group.id)) {
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

        // 기존 옵션 처리
        const existingOptions = await tx.menuOption.findMany({
          where: { groupId: group.id },
          select: { id: true },
        });
        const existingOptionIds = new Set(existingOptions.map((o) => o.id));
        const incomingOptionIds = new Set(
          group.options.filter((o) => o.id).map((o) => o.id!)
        );

        // 삭제된 옵션 제거
        for (const oId of existingOptionIds) {
          if (!incomingOptionIds.has(oId)) {
            await tx.menuOption.delete({ where: { id: oId } });
          }
        }

        // 옵션 upsert
        for (const opt of group.options) {
          if (opt.id && existingOptionIds.has(opt.id)) {
            await tx.menuOption.update({
              where: { id: opt.id },
              data: {
                name: opt.name.trim(),
                extraPrice: opt.extraPrice,
                sortOrder: opt.sortOrder,
              },
            });
          } else {
            await tx.menuOption.create({
              data: {
                groupId: group.id,
                name: opt.name.trim(),
                extraPrice: opt.extraPrice,
                sortOrder: opt.sortOrder,
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
              create: group.options.map((opt) => ({
                name: opt.name.trim(),
                extraPrice: opt.extraPrice,
                sortOrder: opt.sortOrder,
              })),
            },
          },
        });
      }
    }

    return updated;
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

// ─── 메뉴 가져오기 ─────────────────────────────────

export async function applyMenuTemplate(category: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "OWNER" && session.user.role !== "ADMIN")) {
    return { error: "권한이 없습니다." };
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: session.user.id } });
  if (!restaurant) return { error: "음식점을 찾을 수 없습니다." };

  const templates = MENU_TEMPLATES[category];
  if (!templates) return { error: "해당 카테고리 템플릿이 없습니다." };

  let created = 0;
  for (const tmpl of templates) {
    const menu = await prisma.menu.create({
      data: {
        restaurantId: restaurant.id,
        name: tmpl.name,
        price: tmpl.price,
        description: tmpl.description,
        category: tmpl.category,
      },
    });

    if (tmpl.options) {
      for (let i = 0; i < tmpl.options.length; i++) {
        const opt = tmpl.options[i];
        const group = await prisma.menuOptionGroup.create({
          data: {
            menuId: menu.id,
            name: opt.groupName,
            isRequired: opt.isRequired,
            maxSelect: opt.maxSelect,
            sortOrder: i,
          },
        });
        for (let j = 0; j < opt.items.length; j++) {
          await prisma.menuOption.create({
            data: {
              groupId: group.id,
              name: opt.items[j].name,
              extraPrice: opt.items[j].extraPrice,
              sortOrder: j,
            },
          });
        }
      }
    }
    created++;
  }

  revalidatePath("/owner/menus");
  return { success: true, count: created };
}

export async function searchRestaurantsForCopy(query: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "인증 필요" };

  const results = await prisma.restaurant.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
      ownerId: { not: session.user.id },
    },
    select: { id: true, name: true, category: true, _count: { select: { menus: true } } },
    take: 10,
  });

  return { restaurants: results };
}

export async function copyMenusFromRestaurant(sourceRestaurantId: string) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "OWNER" && session.user.role !== "ADMIN")) {
    return { error: "권한이 없습니다." };
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { ownerId: session.user.id } });
  if (!restaurant) return { error: "음식점을 찾을 수 없습니다." };

  const sourceMenus = await prisma.menu.findMany({
    where: { restaurantId: sourceRestaurantId },
    include: { optionGroups: { include: { options: true } } },
  });

  let created = 0;
  for (const src of sourceMenus) {
    const menu = await prisma.menu.create({
      data: {
        restaurantId: restaurant.id,
        name: src.name,
        price: 0,
        description: src.description,
        category: src.category,
      },
    });

    for (const grp of src.optionGroups) {
      const newGroup = await prisma.menuOptionGroup.create({
        data: {
          menuId: menu.id,
          name: grp.name,
          isRequired: grp.isRequired,
          maxSelect: grp.maxSelect,
          sortOrder: grp.sortOrder,
        },
      });
      for (const opt of grp.options) {
        await prisma.menuOption.create({
          data: {
            groupId: newGroup.id,
            name: opt.name,
            extraPrice: opt.extraPrice,
            sortOrder: opt.sortOrder,
          },
        });
      }
    }
    created++;
  }

  revalidatePath("/owner/menus");
  return { success: true, count: created };
}
