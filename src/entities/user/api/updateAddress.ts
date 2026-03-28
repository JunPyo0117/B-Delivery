"use server"

import { auth } from "@/auth"
import { prisma } from "@/shared/api/prisma"
import type { UserAddress } from "../model/types"

interface UpdateAddressInput {
  id: string
  label?: string
  address?: string
  detail?: string | null
  latitude?: number
  longitude?: number
  isDefault?: boolean
}

export async function updateAddress(
  input: UpdateAddressInput,
): Promise<{ success: boolean; data?: UserAddress; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다." }
  }

  try {
    // 소유권 확인
    const existing = await prisma.userAddress.findFirst({
      where: { id: input.id, userId: session.user.id },
    })
    if (!existing) {
      return { success: false, error: "주소를 찾을 수 없습니다." }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 기본 주소로 변경할 경우, 기존 기본 주소 해제
      if (input.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        })
      }

      const address = await tx.userAddress.update({
        where: { id: input.id },
        data: {
          ...(input.label !== undefined && { label: input.label }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.detail !== undefined && { addressDetail: input.detail }),
          ...(input.latitude !== undefined && { latitude: input.latitude }),
          ...(input.longitude !== undefined && { longitude: input.longitude }),
          ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
        },
      })

      // 기본 주소로 설정 시 User 테이블도 업데이트
      if (input.isDefault) {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            defaultAddress: address.address,
            latitude: address.latitude,
            longitude: address.longitude,
          },
        })
      }

      return address
    })

    return {
      success: true,
      data: {
        id: result.id,
        label: result.label,
        address: result.address,
        detail: result.addressDetail,
        latitude: result.latitude,
        longitude: result.longitude,
        isDefault: result.isDefault,
      },
    }
  } catch {
    return { success: false, error: "주소 수정에 실패했습니다." }
  }
}
