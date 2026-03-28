"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface ToggleFavoriteResult {
  isFavorite: boolean;
}

export async function toggleFavorite({
  restaurantId,
}: {
  restaurantId: string;
}): Promise<ToggleFavoriteResult> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("로그인이 필요합니다.");
  }

  const userId = session.user.id;

  // 이미 찜한 상태인지 확인
  const existing = await prisma.favoriteRestaurant.findUnique({
    where: {
      userId_restaurantId: { userId, restaurantId },
    },
  });

  if (existing) {
    // 찜 해제
    await prisma.favoriteRestaurant.delete({
      where: {
        userId_restaurantId: { userId, restaurantId },
      },
    });
    return { isFavorite: false };
  } else {
    // 찜 추가
    await prisma.favoriteRestaurant.create({
      data: { userId, restaurantId },
    });
    return { isFavorite: true };
  }
}
