import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/shared/api/prisma";
import { DeliveryStatus } from "@/generated/prisma/client";

import { DeliveryProgress } from "./_components/delivery-progress";
import { DeliveryInfo } from "./_components/delivery-info";

/**
 * 배달 진행 화면
 *
 * - 현재 활성 배달 조회
 * - 단계별 진행 상태
 * - 가게/고객 정보 표시
 */
export default async function RiderActivePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // 활성 배달 조회
  const activeDelivery = await prisma.delivery.findFirst({
    where: {
      riderId: session.user.id,
      status: {
        notIn: [DeliveryStatus.DONE, DeliveryStatus.CANCELLED],
      },
    },
    include: {
      order: {
        include: {
          restaurant: {
            select: {
              name: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          items: {
            include: {
              menu: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  // 진행 중인 배달이 없으면 메인으로 리다이렉트
  if (!activeDelivery) {
    redirect("/rider");
  }

  const orderItems = activeDelivery.order.items.map((item) => ({
    menuName: item.menu.name,
    quantity: item.quantity,
  }));

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-[#2DB400] px-4 py-4">
        <h1 className="text-[18px] font-bold text-white">배달 진행 중</h1>
        <p className="text-[13px] text-white/80 mt-0.5">
          {activeDelivery.order.restaurant.name}
        </p>
      </header>

      <div className="flex-1 p-4 flex flex-col gap-4">
        {/* 단계별 진행 상태 */}
        <DeliveryProgress
          deliveryId={activeDelivery.id}
          currentStatus={activeDelivery.status}
        />

        {/* 가게 정보 */}
        <DeliveryInfo
          restaurantName={activeDelivery.order.restaurant.name}
          restaurantAddress={activeDelivery.order.restaurant.address}
          restaurantLat={activeDelivery.order.restaurant.latitude}
          restaurantLng={activeDelivery.order.restaurant.longitude}
          deliveryAddress={activeDelivery.order.deliveryAddress}
          deliveryLat={activeDelivery.order.deliveryLat ?? null}
          deliveryLng={activeDelivery.order.deliveryLng ?? null}
          deliveryNote={activeDelivery.order.deliveryNote}
          orderItems={orderItems}
          distance={activeDelivery.distance}
          riderFee={activeDelivery.riderFee}
        />
      </div>
    </div>
  );
}
