"use client";

import { Store, MapPin, FileText, Package, Wallet, Navigation } from "lucide-react";
import { formatPrice, formatDistance } from "@/shared/lib";

interface OrderItem {
  menuName: string;
  quantity: number;
}

interface DeliveryInfoProps {
  restaurantName: string;
  restaurantAddress: string;
  deliveryAddress: string;
  deliveryNote: string | null;
  orderItems: OrderItem[];
  distance: number | null;
  riderFee: number;
}

/**
 * 가게/고객 주소 + 주문 정보 카드
 */
export function DeliveryInfo({
  restaurantName,
  restaurantAddress,
  deliveryAddress,
  deliveryNote,
  orderItems,
  distance,
  riderFee,
}: DeliveryInfoProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 경로 정보 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <h3 className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Navigation className="size-4 text-[#2DB400]" />
          배달 경로
        </h3>

        {/* 가게 */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-50 mt-0.5">
            <Store className="size-4 text-orange-500" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900">
              {restaurantName}
            </p>
            <p className="text-[12px] text-gray-500">{restaurantAddress}</p>
          </div>
        </div>

        {/* 연결 점선 */}
        <div className="ml-4 border-l-2 border-dashed border-gray-200 h-4" />

        {/* 배달지 */}
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 mt-0.5">
            <MapPin className="size-4 text-blue-500" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900">배달지</p>
            <p className="text-[12px] text-gray-500">{deliveryAddress}</p>
          </div>
        </div>

        {/* 배달 요청사항 */}
        {deliveryNote && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-yellow-50 p-3">
            <FileText className="size-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-yellow-700">{deliveryNote}</p>
          </div>
        )}

        {/* 거리 & 배달비 */}
        <div className="mt-3 flex items-center gap-4 text-[13px] text-gray-600">
          {distance != null && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {formatDistance(distance)}
            </span>
          )}
          <span className="flex items-center gap-1 font-semibold text-[#2DB400]">
            <Wallet className="size-3.5" />
            {formatPrice(riderFee)}
          </span>
        </div>
      </div>

      {/* 주문 정보 */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <h3 className="text-[14px] font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Package className="size-4 text-[#2DB400]" />
          주문 내역
        </h3>

        <ul className="flex flex-col gap-2">
          {orderItems.map((item, index) => (
            <li
              key={index}
              className="flex items-center justify-between text-[13px]"
            >
              <span className="text-gray-700">{item.menuName}</span>
              <span className="text-gray-500">{item.quantity}개</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
