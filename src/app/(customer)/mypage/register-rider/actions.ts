"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TransportType, Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

interface RegisterRiderInput {
  name: string;
  phone: string;
  transportType: string;
  activityArea: string | null;
  activityLat: number | null;
  activityLng: number | null;
}

const VALID_TRANSPORT_TYPES: string[] = Object.values(TransportType);

export async function registerRider(
  input: RegisterRiderInput
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "로그인이 필요합니다." };
  }

  if (session.user.role !== "USER") {
    return { error: "이미 다른 역할로 등록되어 있습니다." };
  }

  // 입력 검증
  const name = input.name.trim();
  if (!name || name.length > 30) {
    return { error: "이름은 1~30자로 입력해주세요." };
  }

  const phone = input.phone.trim();
  if (!phone || !/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone)) {
    return { error: "올바른 전화번호를 입력해주세요." };
  }

  if (!VALID_TRANSPORT_TYPES.includes(input.transportType)) {
    return { error: "올바른 이동수단을 선택해주세요." };
  }

  if (!input.activityArea || input.activityLat == null || input.activityLng == null) {
    return { error: "활동 지역 주소를 검색하여 설정해주세요." };
  }

  try {
    await prisma.$transaction([
      prisma.riderProfile.create({
        data: {
          userId: session.user.id,
          transportType: input.transportType as TransportType,
          activityArea: input.activityArea,
          activityLat: input.activityLat,
          activityLng: input.activityLng,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          role: "RIDER",
          nickname: name,
        },
      }),
    ]);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "이미 배달기사로 등록되어 있습니다." };
    }
    throw err;
  }

  revalidatePath("/mypage");

  return { success: true };
}
