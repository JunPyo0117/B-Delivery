"use server"

import { auth } from "@/auth"
import { prisma } from "@/shared/api/prisma"
import type { UserProfile } from "../model/types"

interface UpdateProfileInput {
  nickname?: string
  image?: string | null
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다." }
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(input.nickname !== undefined && { nickname: input.nickname }),
        ...(input.image !== undefined && { image: input.image }),
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        image: true,
        role: true,
        defaultAddress: true,
        latitude: true,
        longitude: true,
      },
    })

    return { success: true, data: user }
  } catch {
    return { success: false, error: "프로필 수정에 실패했습니다." }
  }
}
