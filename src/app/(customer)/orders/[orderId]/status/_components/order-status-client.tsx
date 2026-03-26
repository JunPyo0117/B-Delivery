"use client";

import { useEffect, useMemo } from "react";
import { ArrowLeft, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";

import { useOrderSocket } from "@/hooks/useOrderSocket";
import { useOrderStore } from "@/stores/order";
import type { OrderStatus } from "@/types/order";

interface OrderStatusData {
  orderId: string;
  status: OrderStatus;
  restaurantName: string;
  restaurantLatitude: number;
  restaurantLongitude: number;
  restaurantAddress: string | null;
  deliveryAddress: string;
  deliveryTime: number;
  totalPrice: number;
  createdAt: string;
  items: {
    id: string;
    menuName: string;
    quantity: number;
    price: number;
  }[];
}

interface OrderStatusClientProps {
  initialData: OrderStatusData;
}

const STATUS_STEPS = [
  { key: "PENDING", label: "주문접수" },
  { key: "COOKING", label: "조리중" },
  { key: "PICKED_UP", label: "배달중" },
  { key: "DONE", label: "배달완료" },
] as const;

const STATUS_EMOJI: Record<string, string> = {
  PENDING: "📋",
  COOKING: "🍳",
  PICKED_UP: "🛵",
  DONE: "✅",
};

const STATUS_TITLE: Record<string, string> = {
  PENDING: "주문을 접수 중이에요",
  COOKING: "조리 중이에요",
  PICKED_UP: "배달 중이에요",
  DONE: "배달이 완료되었어요",
};

const STATUS_SUBTITLE: Record<string, string> = {
  PENDING: "음식점에서 주문을 확인하고 있어요",
  COOKING: "맛있게 준비하고 있으니 조금만 기다려 주세요",
  PICKED_UP: "라이더가 음식을 배달하고 있어요",
  DONE: "맛있게 드세요!",
};

export function OrderStatusClient({ initialData }: OrderStatusClientProps) {
  const {
    orderId,
    restaurantName,
    deliveryAddress,
    totalPrice,
    createdAt,
    items,
  } = initialData;

  const setOrderStatus = useOrderStore((s) => s.setOrderStatus);

  // Zustand 스토어 초기 설정
  useEffect(() => {
    setOrderStatus(orderId, initialData.status);
  }, [orderId, initialData.status, setOrderStatus]);

  // WebSocket 연결 - 실시간 상태 업데이트
  const { isConnected } = useOrderSocket({
    enabled: true,
    onStatusChange: (event) => {
      if (event.orderId === orderId) {
        // 스토어가 이미 업데이트되므로 추가 작업 없음
      }
    },
  });

  // Zustand에서 현재 상태 구독
  const currentStatus = useOrderStore(
    (s) => s.orders[orderId]?.status ?? initialData.status
  );

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center h-12 px-4">
          <Link
            href={`/orders/${orderId}`}
            className="mr-3 p-1"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="size-5 text-gray-900" />
          </Link>
          <h1 className="text-[16px] font-bold text-gray-900">주문 상태</h1>
          {/* 실시간 연결 표시 */}
          <div className="ml-auto flex items-center gap-1.5">
            <div
              className={`size-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-[10px] text-gray-400">
              {isConnected ? "실시간" : "연결중"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 pb-6">
        {/* 지도 영역 (카카오맵 플레이스홀더) */}
        <div className="relative w-full h-48 flex items-center justify-center" style={{ backgroundColor: "#e8f5e9" }}>
          <div className="flex flex-col items-center gap-2">
            <div className="size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#2DB400" }}>
              <MapPin className="size-5 text-white" />
            </div>
            <span className="text-[12px] font-medium text-gray-500">배달 위치</span>
          </div>
        </div>

        {/* 상태 텍스트 */}
        <div className="bg-white px-4 py-6 text-center">
          <p className="text-[20px] font-bold text-gray-900">
            {STATUS_TITLE[currentStatus] ?? "주문 처리 중"} {STATUS_EMOJI[currentStatus] ?? ""}
          </p>
          <p className="text-[13px] text-gray-500 mt-1">
            {STATUS_SUBTITLE[currentStatus] ?? ""}
          </p>
        </div>

        {/* 단계 인디케이터 */}
        <div className="bg-white px-6 pb-6">
          <div className="flex items-center justify-between relative">
            {/* 연결선 (배경) */}
            <div className="absolute top-[10px] left-[10px] right-[10px] h-[2px] bg-gray-200 z-0" />
            {/* 연결선 (진행) */}
            <div
              className="absolute top-[10px] left-[10px] h-[2px] z-[1] transition-all duration-500"
              style={{
                backgroundColor: "#2DB400",
                width: currentStepIndex >= 0
                  ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`
                  : "0%",
                maxWidth: "calc(100% - 20px)",
              }}
            />

            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.key} className="flex flex-col items-center z-10">
                  {/* 원형 도트 */}
                  <div
                    className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCompleted
                        ? "border-transparent"
                        : "border-gray-300 bg-white"
                    } ${isCurrent ? "scale-125" : ""}`}
                    style={isCompleted ? { backgroundColor: "#2DB400" } : {}}
                  >
                    {isCompleted && (
                      <div className="size-2 rounded-full bg-white" />
                    )}
                  </div>
                  {/* 라벨 */}
                  <span
                    className={`text-[11px] mt-2 ${
                      isCompleted ? "font-semibold" : "text-gray-400"
                    }`}
                    style={isCompleted ? { color: "#2DB400" } : {}}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-2 bg-gray-50" />

        {/* 주문 정보 */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-gray-900">{restaurantName}</h3>
            <Link
              href="#"
              className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-gray-50"
              style={{ borderColor: "#2DB400", color: "#2DB400" }}
            >
              <MessageCircle className="size-3.5" />
              채팅 문의
            </Link>
          </div>

          {/* 아이템 목록 */}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center"
              >
                <span className="text-[13px] text-gray-700">
                  {item.menuName}
                  <span className="text-gray-400 ml-1">{item.quantity}개</span>
                </span>
                <span className="text-[13px] font-medium text-gray-700">
                  {(item.price * item.quantity).toLocaleString()}원
                </span>
              </div>
            ))}
          </div>

          {/* 총 결제 금액 */}
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
            <span className="text-[14px] font-bold text-gray-900">총 결제금액</span>
            <span
              className="text-[15px] font-extrabold"
              style={{ color: "#2DB400" }}
            >
              {totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 배달 주소 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="flex items-start gap-2.5">
            <MapPin className="size-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-[13px] font-bold text-gray-900 mb-1">배달 주소</h3>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                {deliveryAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
