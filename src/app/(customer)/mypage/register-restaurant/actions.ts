"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RestaurantCategory, Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

interface RegisterRestaurantInput {
  name: string;
  category: string;
  imageUrl: string | null;
  description: string | null;
  minOrderAmount: number;
  deliveryFee: number;
  deliveryTime: number;
  address: string | null;
  latitude: number;
  longitude: number;
}

const VALID_CATEGORIES: string[] = Object.values(RestaurantCategory).filter(
  (c) => c !== "ALL"
);

export async function registerRestaurant(
  input: RegisterRestaurantInput
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  if (session.user.role !== "USER") {
    return { error: "이미 음식점을 등록하셨습니다." };
  }

  // 입력 검증
  const name = input.name.trim();
  if (!name || name.length > 50) {
    return { error: "음식점 이름은 1~50자로 입력해주세요." };
  }

  if (!VALID_CATEGORIES.includes(input.category)) {
    return { error: "올바른 카테고리를 선택해주세요." };
  }

  if (input.minOrderAmount < 0) {
    return { error: "최소 주문 금액은 0원 이상이어야 합니다." };
  }

  if (input.deliveryFee < 0) {
    return { error: "배달비는 0원 이상이어야 합니다." };
  }

  if (input.deliveryTime < 10 || input.deliveryTime > 120) {
    return { error: "예상 배달 시간은 10~120분 사이로 입력해주세요." };
  }

  if (input.latitude == null || input.longitude == null) {
    return { error: "주소를 검색하여 위치를 설정해주세요." };
  }

  if (input.description && input.description.length > 500) {
    return { error: "소개글은 500자 이내로 입력해주세요." };
  }

  try {
    await prisma.$transaction([
      prisma.restaurant.create({
        data: {
          ownerId: session.user.id,
          name,
          category: input.category as RestaurantCategory,
          imageUrl: input.imageUrl,
          description: input.description || null,
          minOrderAmount: input.minOrderAmount,
          deliveryFee: input.deliveryFee,
          deliveryTime: input.deliveryTime,
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { role: "OWNER" },
      }),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "이미 음식점을 등록하셨습니다." };
    }
    throw error;
  }

  revalidatePath("/mypage");

  return { success: true };
}
