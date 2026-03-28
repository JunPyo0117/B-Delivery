"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";

export async function checkFavorite({
  restaurantId,
}: {
  restaurantId: string;
}): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) {
    return false;
  }

  const favorite = await prisma.favoriteRestaurant.findUnique({
    where: {
      userId_restaurantId: {
        userId: session.user.id,
        restaurantId,
      },
    },
  });

  return !!favorite;
}
