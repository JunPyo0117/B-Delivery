"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(
  restaurantId: string
): Promise<{ isFavorited: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("로그인이 필요합니다.");
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
    revalidatePath(`/restaurants/${restaurantId}`);
    return { isFavorited: false };
  }

  await prisma.favoriteRestaurant.create({
    data: { userId, restaurantId },
  });
  revalidatePath(`/restaurants/${restaurantId}`);
  return { isFavorited: true };
}
