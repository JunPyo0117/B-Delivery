"use server"

import { auth } from "@/auth"
import { prisma } from "@/shared/api/prisma"
import type { UserAddress } from "../model/types"

export async function getAddresses(): Promise<UserAddress[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const addresses = await prisma.userAddress.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      label: true,
      address: true,
      addressDetail: true,
      latitude: true,
      longitude: true,
      isDefault: true,
    },
  })

  return addresses.map((addr) => ({
    id: addr.id,
    label: addr.label,
    address: addr.address,
    detail: addr.addressDetail,
    latitude: addr.latitude,
    longitude: addr.longitude,
    isDefault: addr.isDefault,
  }))
}
