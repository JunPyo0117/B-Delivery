"use client";

import { Package, Wallet } from "lucide-react";
import { formatPrice } from "@/shared/lib";

interface DeliveryStatsProps {
  todayDeliveries: number;
  todayEarnings: number;
}

/**
 * 오늘 배달 통계 카드
 * - 오늘 배달 건수
 * - 오늘 수익
 */
export function DeliveryStats({
  todayDeliveries,
  todayEarnings,
}: DeliveryStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex size-10 items-center justify-center rounded-full bg-blue-50">
          <Package className="size-5 text-blue-500" />
        </div>
        <div>
          <p className="text-[12px] text-gray-500">오늘 배달</p>
          <p className="text-[18px] font-bold text-gray-900">
            {todayDeliveries}건
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <div className="flex size-10 items-center justify-center rounded-full bg-green-50">
          <Wallet className="size-5 text-[#2DB400]" />
        </div>
        <div>
          <p className="text-[12px] text-gray-500">오늘 수익</p>
          <p className="text-[18px] font-bold text-gray-900">
            {formatPrice(todayEarnings)}
          </p>
        </div>
      </div>
    </div>
  );
}
