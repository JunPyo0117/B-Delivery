"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(
  restaurantId: string
): Promise<{ success?: boolean; isFavorited?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  if (!restaurantId) {
    return { error: "음식점 정보가 필요합니다." };
  }

  const userId = session.user.id;

  const existing = await prisma.favoriteRestaurant.findUnique({
    where: {
      userId_restaurantId: { userId, restaurantId },
    },
  });

  if (existing) {
    await prisma.favoriteRestaurant.delete({
      where: {
        userId_restaurantId: { userId, restaurantId },
      },
    });
    revalidatePath("/favorites");
    return { success: true, isFavorited: false };
  }

  await prisma.favoriteRestaurant.create({
    data: { userId, restaurantId },
  });

  revalidatePath("/favorites");
  return { success: true, isFavorited: true };
}
