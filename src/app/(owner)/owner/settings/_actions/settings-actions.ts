"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { RestaurantCategory } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

// ─── Types ──────────────────────────────────────────────

export interface SettingsData {
  id: string;
  name: string;
  category: string;
  address: string;
  imageUrl: string | null;
  description: string | null;
  notice: string | null;
  minOrderAmount: number;
  deliveryFee: number;
  deliveryTime: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  latitude: number;
  longitude: number;
}

export interface UpdateSettingsInput {
  name: string;
  category: string;
  address: string | null;
  imageUrl: string | null;
  description: string | null;
  notice: string | null;
  minOrderAmount: number;
  deliveryFee: number;
  deliveryTime: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  latitude: number;
  longitude: number;
}

type ActionResult = { success: true } | { success: false; error: string };

// ─── Validation ─────────────────────────────────────────

const VALID_CATEGORIES = Object.values(RestaurantCategory);

function validateSettings(input: UpdateSettingsInput): string | null {
  const name = input.name.trim();
  if (!name || name.length > 50) {
    return "음식점 이름은 1~50자로 입력해주세요.";
  }

  if (!VALID_CATEGORIES.includes(input.category as RestaurantCategory)) {
    return "올바른 카테고리를 선택해주세요.";
  }

  if (input.minOrderAmount < 0) {
    return "최소 주문금액은 0원 이상이어야 합니다.";
  }

  if (input.deliveryFee < 0) {
    return "배달비는 0원 이상이어야 합니다.";
  }

  if (input.deliveryTime < 10 || input.deliveryTime > 120) {
    return "예상 배달시간은 10~120분 사이로 입력해주세요.";
  }

  if (input.latitude == null || input.longitude == null) {
    return "주소를 검색하여 위치를 설정해주세요.";
  }

  if (input.description && input.description.length > 500) {
    return "소개글은 500자 이내로 입력해주세요.";
  }

  if (input.notice && input.notice.length > 500) {
    return "공지사항은 500자 이내로 입력해주세요.";
  }

  // 영업시간 형식 검증 (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (input.openTime && !timeRegex.test(input.openTime)) {
    return "시작시간 형식이 올바르지 않습니다. (HH:MM)";
  }
  if (input.closeTime && !timeRegex.test(input.closeTime)) {
    return "종료시간 형식이 올바르지 않습니다. (HH:MM)";
  }

  return null;
}

// ─── Server Actions ─────────────────────────────────────

export async function getSettings(): Promise<SettingsData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      category: true,
      address: true,
      imageUrl: true,
      description: true,
      notice: true,
      minOrderAmount: true,
      deliveryFee: true,
      deliveryTime: true,
      isOpen: true,
      openTime: true,
      closeTime: true,
      latitude: true,
      longitude: true,
    },
  });

  return restaurant;
}

export async function updateSettings(
  input: UpdateSettingsInput
): Promise<ActionResult> {
  // 1. 인증 확인
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  // 2. OWNER 역할 확인
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return { success: false, error: "사장님만 수정할 수 있습니다." };
  }

  // 3. 소유권 확인
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!restaurant) {
    return { success: false, error: "등록된 음식점이 없습니다." };
  }

  // 4. 입력 검증
  const validationError = validateSettings(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  // 5. DB 업데이트 (PostGIS location 컬럼은 트리거로 자동 동기화)
  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      name: input.name.trim(),
      category: input.category as RestaurantCategory,
      address: input.address ?? "",
      imageUrl: input.imageUrl,
      description: input.description?.trim() || null,
      notice: input.notice?.trim() || null,
      minOrderAmount: input.minOrderAmount,
      deliveryFee: input.deliveryFee,
      deliveryTime: input.deliveryTime,
      isOpen: input.isOpen,
      openTime: input.openTime || null,
      closeTime: input.closeTime || null,
      latitude: input.latitude,
      longitude: input.longitude,
    },
  });

  // 6. 캐시 무효화
  revalidatePath("/owner/settings");
  revalidatePath("/owner/dashboard");
  revalidatePath("/owner/restaurant-info");

  return { success: true };
}
