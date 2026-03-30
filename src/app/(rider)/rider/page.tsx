import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { DeliveryStatus } from "@/generated/prisma/client";

import { DeliveryToggle } from "./_components/delivery-toggle";
import { DeliveryStats } from "./_components/delivery-stats";
import { DeliveryMap } from "./_components/delivery-map";
import { RiderWaitingClient } from "./_components/rider-waiting-client";

/**
 * 배달 대기 (메인 화면)
 *
 * - 온/오프라인 토글
 * - 오늘 배달 통계
 * - 지도 플레이스홀더
 * - 실시간 배달 요청 수신 영역
 */
export default async function RiderPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 기사 프로필 조회
  const riderProfile = await prisma.riderProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!riderProfile) {
    redirect("/mypage/register-rider");
  }

  // 기사 위치 정보 (온라인 여부)
  const riderLocation = await prisma.riderLocation.findUnique({
    where: { userId: session.user.id },
  });

  const isOnline = riderLocation?.isOnline ?? false;

  // 오늘 통계
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayDeliveries = await prisma.delivery.findMany({
    where: {
      riderId: session.user.id,
      status: DeliveryStatus.DONE,
      completedAt: { gte: todayStart },
    },
    select: { riderFee: true },
  });

  const todayCount = todayDeliveries.length;
  const todayEarnings = todayDeliveries.reduce(
    (sum, d) => sum + d.riderFee,
    0
  );

  // 이미 진행 중인 배달이 있는지 확인
  const activeDelivery = await prisma.delivery.findFirst({
    where: {
      riderId: session.user.id,
      status: {
        notIn: [DeliveryStatus.DONE, DeliveryStatus.CANCELLED],
      },
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 헤더 */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">배달 대기</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {riderProfile.activityArea ?? "활동 지역 미설정"}
          </p>
        </div>
      </header>

      {/* 온/오프라인 토글 */}
      <DeliveryToggle initialIsOnline={isOnline} />

      {/* 오늘 통계 */}
      <DeliveryStats
        todayDeliveries={todayCount}
        todayEarnings={todayEarnings}
      />

      {/* 진행 중인 배달 안내 */}
      {activeDelivery && (
        <a
          href="/rider/active"
          className="flex items-center justify-between rounded-2xl bg-[#2DB400]/10 p-4 border border-[#2DB400]/20"
        >
          <div>
            <p className="text-[14px] font-semibold text-[#2DB400]">
              진행 중인 배달이 있습니다
            </p>
            <p className="text-[12px] text-gray-600 mt-0.5">
              탭하여 배달 화면으로 이동
            </p>
          </div>
          <span className="text-[#2DB400] text-[20px]">&rarr;</span>
        </a>
      )}

      {/* 현재 위치 지도 */}
      <DeliveryMap
        lat={riderLocation?.latitude ?? 0}
        lng={riderLocation?.longitude ?? 0}
      />

      {/* 실시간 배달 요청 영역 (Client) */}
      <RiderWaitingClient riderId={session.user.id} isOnline={isOnline} />
    </div>
  );
}
