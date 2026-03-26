"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface CreateAddressInput {
  label: string;
  address: string;
  addressDetail?: string;
  latitude: number;
  longitude: number;
}

interface UpdateAddressInput {
  id: string;
  label: string;
  address: string;
  addressDetail?: string;
  latitude: number;
  longitude: number;
}

/** User 모델의 기본 주소 필드를 UserAddress와 동기화 */
async function syncUserDefaultAddress(
  userId: string,
  address: string | null,
  latitude: number | null,
  longitude: number | null
) {
  await prisma.user.update({
    where: { id: userId },
    data: { defaultAddress: address, latitude, longitude },
  });
  // 홈 화면 헤더 주소도 갱신
  revalidatePath("/");
}

export async function createAddress(
  input: CreateAddressInput
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const label = input.label.trim();
  if (!label || label.length > 20) {
    return { error: "별칭은 1~20자로 입력해주세요." };
  }

  if (!input.address || input.latitude == null || input.longitude == null) {
    return { error: "주소를 검색해주세요." };
  }

  const userId = session.user.id;

  // 첫 주소인 경우 자동으로 기본 주소 설정
  const existingCount = await prisma.userAddress.count({
    where: { userId },
  });
  const shouldBeDefault = existingCount === 0;

  const created = await prisma.userAddress.create({
    data: {
      userId,
      label,
      address: input.address,
      addressDetail: input.addressDetail || null,
      latitude: input.latitude,
      longitude: input.longitude,
      isDefault: shouldBeDefault,
    },
  });

  if (shouldBeDefault) {
    await syncUserDefaultAddress(
      userId,
      created.address,
      created.latitude,
      created.longitude
    );
  }

  revalidatePath("/mypage/addresses");
  revalidatePath("/mypage");

  return { success: true };
}

export async function updateAddress(
  input: UpdateAddressInput
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const label = input.label.trim();
  if (!label || label.length > 20) {
    return { error: "별칭은 1~20자로 입력해주세요." };
  }

  const existing = await prisma.userAddress.findUnique({
    where: { id: input.id },
  });

  if (!existing || existing.userId !== session.user.id) {
    return { error: "주소를 찾을 수 없습니다." };
  }

  const updated = await prisma.userAddress.update({
    where: { id: input.id },
    data: {
      label,
      address: input.address,
      addressDetail: input.addressDetail || null,
      latitude: input.latitude,
      longitude: input.longitude,
    },
  });

  // 기본 주소인 경우 User 동기화
  if (updated.isDefault) {
    await syncUserDefaultAddress(
      session.user.id,
      updated.address,
      updated.latitude,
      updated.longitude
    );
  }

  revalidatePath("/mypage/addresses");
  revalidatePath("/mypage");

  return { success: true };
}

export async function deleteAddress(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const existing = await prisma.userAddress.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    return { error: "주소를 찾을 수 없습니다." };
  }

  await prisma.userAddress.delete({ where: { id } });

  // 기본 주소 삭제 시 다음 주소를 기본으로 승격
  if (existing.isDefault) {
    const next = await prisma.userAddress.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });

    if (next) {
      await prisma.userAddress.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
      await syncUserDefaultAddress(
        session.user.id,
        next.address,
        next.latitude,
        next.longitude
      );
    } else {
      await syncUserDefaultAddress(session.user.id, null, null, null);
    }
  }

  revalidatePath("/mypage/addresses");
  revalidatePath("/mypage");

  return { success: true };
}

export async function setDefaultAddress(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  const target = await prisma.userAddress.findUnique({
    where: { id },
  });

  if (!target || target.userId !== session.user.id) {
    return { error: "주소를 찾을 수 없습니다." };
  }

  if (target.isDefault) {
    return { success: true };
  }

  await prisma.$transaction([
    // 기존 기본 주소 해제
    prisma.userAddress.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    }),
    // 새 기본 주소 설정
    prisma.userAddress.update({
      where: { id },
      data: { isDefault: true },
    }),
    // User 모델 동기화
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        defaultAddress: target.address,
        latitude: target.latitude,
        longitude: target.longitude,
      },
    }),
  ]);

  revalidatePath("/mypage/addresses");
  revalidatePath("/mypage");
  revalidatePath("/");

  return { success: true };
}
