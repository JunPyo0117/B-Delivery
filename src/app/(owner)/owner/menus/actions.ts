"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { revalidatePath } from "next/cache";

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

const MENU_TEMPLATES: Record<string, { name: string; price: number; description: string; category: string; options?: { groupName: string; isRequired: boolean; maxSelect: number; items: { name: string; extraPrice: number }[] }[] }[]> = {
  CHICKEN: [
    { name: "후라이드치킨", price: 0, description: "바삭 후라이드", category: "치킨", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "한마리", extraPrice: 0 }, { name: "반마리", extraPrice: -5000 }] }, { groupName: "부위", isRequired: false, maxSelect: 1, items: [{ name: "순살", extraPrice: 2000 }, { name: "뼈", extraPrice: 0 }] }] },
    { name: "양념치킨", price: 0, description: "달콤 매콤 양념", category: "치킨", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "한마리", extraPrice: 0 }, { name: "반마리", extraPrice: -5000 }] }] },
    { name: "간장치킨", price: 0, description: "달콤한 간장", category: "치킨", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "한마리", extraPrice: 0 }, { name: "반마리", extraPrice: -5000 }] }] },
    { name: "반반치킨", price: 0, description: "후라이드+양념", category: "치킨" },
    { name: "치킨텐더", price: 0, description: "순살 텐더", category: "사이드" },
    { name: "치즈볼", price: 0, description: "쫀득 치즈볼", category: "사이드" },
    { name: "콜라", price: 0, description: "시원한 콜라", category: "음료", options: [{ groupName: "사이즈", isRequired: false, maxSelect: 1, items: [{ name: "500ml", extraPrice: 0 }, { name: "1.5L", extraPrice: 1000 }] }] },
  ],
  KOREAN: [
    { name: "된장찌개", price: 0, description: "구수한 된장찌개", category: "찌개" },
    { name: "김치찌개", price: 0, description: "얼큰한 김치찌개", category: "찌개" },
    { name: "제육볶음", price: 0, description: "매콤 제육볶음 정식", category: "정식" },
    { name: "비빔밥", price: 0, description: "신선한 나물 비빔밥", category: "밥" },
    { name: "불고기 정식", price: 0, description: "달콤한 불고기", category: "정식" },
    { name: "공기밥", price: 0, description: "갓 지은 공기밥", category: "밥" },
  ],
  CHINESE: [
    { name: "짜장면", price: 0, description: "춘장 듬뿍", category: "면" },
    { name: "짬뽕", price: 0, description: "얼큰한 해물짬뽕", category: "면" },
    { name: "탕수육", price: 0, description: "바삭한 탕수육", category: "튀김", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "소", extraPrice: 0 }, { name: "대", extraPrice: 7000 }] }] },
    { name: "볶음밥", price: 0, description: "새우볶음밥", category: "밥" },
    { name: "군만두", price: 0, description: "바삭 군만두 5개", category: "만두" },
  ],
  PIZZA: [
    { name: "페퍼로니 피자", price: 0, description: "클래식 페퍼로니", category: "피자", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "M", extraPrice: 0 }, { name: "L", extraPrice: 5000 }] }] },
    { name: "콤비네이션 피자", price: 0, description: "푸짐한 콤비네이션", category: "피자", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "M", extraPrice: 0 }, { name: "L", extraPrice: 5000 }] }] },
    { name: "고구마 피자", price: 0, description: "달콤한 고구마 무스", category: "피자" },
    { name: "콜라 1.25L", price: 0, description: "시원한 콜라", category: "음료" },
  ],
  BUNSIK: [
    { name: "떡볶이", price: 0, description: "매콤 쫀득", category: "떡볶이" },
    { name: "순대", price: 0, description: "당면 순대", category: "순대" },
    { name: "튀김 모듬", price: 0, description: "야채+고구마+김말이", category: "튀김" },
    { name: "참치 김밥", price: 0, description: "참치마요 김밥", category: "김밥" },
    { name: "라볶이", price: 0, description: "라면+떡볶이", category: "떡볶이" },
  ],
  JAPANESE: [
    { name: "돈코츠 라멘", price: 0, description: "진한 돼지뼈 육수", category: "라멘" },
    { name: "로스카츠", price: 0, description: "바삭한 로스카츠", category: "돈카츠" },
    { name: "연어초밥 8p", price: 0, description: "신선한 연어초밥", category: "초밥" },
    { name: "카레라이스", price: 0, description: "걸쭉한 일본식 카레", category: "카레" },
    { name: "우동", price: 0, description: "쫄깃한 사누끼 우동", category: "우동" },
  ],
};

export function getMenuTemplates() {
  return MENU_TEMPLATES;
}

export function getTemplateCategories() {
  return Object.keys(MENU_TEMPLATES);
}

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
