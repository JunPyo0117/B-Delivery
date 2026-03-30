"use server";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { revalidatePath } from "next/cache";

interface UpdateProfileInput {
  nickname: string;
  image: string | null;
  defaultAddress: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const nickname = input.nickname.trim();
  if (!nickname || nickname.length > 20) {
    return { error: "닉네임은 1~20자로 입력해주세요." };
  }

  if (
    input.defaultAddress &&
    (input.latitude == null || input.longitude == null)
  ) {
    return { error: "주소의 좌표 정보가 없습니다." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      nickname,
      image: input.image,
      defaultAddress: input.defaultAddress,
      latitude: input.latitude,
      longitude: input.longitude,
    },
  });

  revalidatePath("/mypage");
  revalidatePath("/mypage/profile");

  return { success: true };
}
