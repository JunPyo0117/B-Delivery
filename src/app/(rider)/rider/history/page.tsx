import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { DeliveryStatus } from "@/generated/prisma/client";

import { HistoryList } from "./_components/history-list";

/**
 * 배달 내역 페이지
 *
 * - 완료/취소된 배달 목록
 * - 날짜별 그룹핑
 */
export default async function RiderHistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const deliveries = await prisma.delivery.findMany({
    where: {
      riderId: session.user.id,
      status: { in: [DeliveryStatus.DONE, DeliveryStatus.CANCELLED] },
    },
    include: {
      order: {
        include: {
          restaurant: { select: { name: true } },
        },
      },
    },
    orderBy: { completedAt: "desc" },
    take: 50,
  });

  const items = deliveries.map((d) => ({
    id: d.id,
    restaurantName: d.order.restaurant.name,
    deliveryAddress: d.order.deliveryAddress,
    distance: d.distance,
    riderFee: d.riderFee,
    completedAt: (d.completedAt ?? d.updatedAt).toISOString(),
    status: d.status,
  }));

  return (
    <div className="flex flex-col min-h-dvh">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
        <h1 className="text-[20px] font-bold text-gray-900">배달 내역</h1>
      </header>

      <div className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-[14px] text-gray-400">
              아직 배달 내역이 없습니다
            </p>
          </div>
        ) : (
          <HistoryList items={items} />
        )}
      </div>
    </div>
  );
}
