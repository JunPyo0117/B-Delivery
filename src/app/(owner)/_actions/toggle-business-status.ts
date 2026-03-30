"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { revalidatePath } from "next/cache";

/**
 * 음식점 영업 상태를 변경하는 Server Action
 */
export async function toggleBusinessStatus(
  restaurantId: string,
  isOpen: boolean
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("인증이 필요합니다.");
  }

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    throw new Error("권한이 없습니다.");
  }

  if (session.user.role === "OWNER") {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    });

    if (!restaurant) {
      throw new Error("음식점을 찾을 수 없습니다.");
    }

    if (restaurant.ownerId !== session.user.id) {
      throw new Error("본인 소유의 음식점만 수정할 수 있습니다.");
    }
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { isOpen },
  });

  revalidatePath("/owner", "layout");
}
