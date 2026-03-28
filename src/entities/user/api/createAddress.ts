"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { UserAddress } from "../model/types"

interface CreateAddressInput {
  label: string
  address: string
  detail?: string
  latitude: number
  longitude: number
  isDefault?: boolean
}

export async function createAddress(
  input: CreateAddressInput,
): Promise<{ success: boolean; data?: UserAddress; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다." }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 기본 주소로 설정할 경우, 기존 기본 주소 해제
      if (input.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        })
      }

      const address = await tx.userAddress.create({
        data: {
          userId: session.user.id,
          label: input.label,
          address: input.address,
          addressDetail: input.detail ?? null,
          latitude: input.latitude,
          longitude: input.longitude,
          isDefault: input.isDefault ?? false,
        },
      })

      // 기본 주소로 설정 시 User 테이블도 업데이트
      if (input.isDefault) {
        await tx.user.update({
          where: { id: session.user.id },
          data: {
            defaultAddress: input.address,
            latitude: input.latitude,
            longitude: input.longitude,
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
    return { success: false, error: "주소 추가에 실패했습니다." }
  }
}
