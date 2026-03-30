"use server"

import { auth } from "@/auth"
import { prisma } from "@/shared/api/prisma"

export async function deleteAddress(
  addressId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다." }
  }

  try {
    // 소유권 확인
    const existing = await prisma.userAddress.findFirst({
      where: { id: addressId, userId: session.user.id },
    })
    if (!existing) {
      return { success: false, error: "주소를 찾을 수 없습니다." }
    }

    await prisma.$transaction(async (tx) => {
      await tx.userAddress.delete({
        where: { id: addressId },
      })

      // 삭제된 주소가 기본 주소였다면 User의 기본 주소 초기화
      if (existing.isDefault) {
        // 남은 주소 중 가장 최근 것을 기본 주소로 승격
        const nextDefault = await tx.userAddress.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        })

        if (nextDefault) {
          await tx.userAddress.update({
            where: { id: nextDefault.id },
            data: { isDefault: true },
          })
          await tx.user.update({
            where: { id: session.user.id },
            data: {
              defaultAddress: nextDefault.address,
              latitude: nextDefault.latitude,
              longitude: nextDefault.longitude,
            },
          })
        } else {
          // 주소가 하나도 없으면 null로 초기화
          await tx.user.update({
            where: { id: session.user.id },
            data: {
              defaultAddress: null,
              latitude: null,
              longitude: null,
            },
          })
        }
      }
    })

    return { success: true }
  } catch {
    return { success: false, error: "주소 삭제에 실패했습니다." }
  }
}
