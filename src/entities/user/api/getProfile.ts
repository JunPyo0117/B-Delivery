"use server"

import { auth } from "@/auth"
import { prisma } from "@/shared/api/prisma"
import type { UserProfile } from "../model/types"

export async function getProfile(): Promise<UserProfile | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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

  return user
}
