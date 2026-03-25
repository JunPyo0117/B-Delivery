"use client";

import { useEffect, useMemo } from "react";
import { ArrowLeft, Clock, MapPin, Phone, Store } from "lucide-react";
import Link from "next/link";

import { useOrderStatus } from "@/hooks/useOrderStatus";
import { useOrderStore } from "@/stores/order";
import type { OrderStatus } from "@/types/order";
import { ORDER_STATUS_LABEL } from "@/types/order";
import { OrderProgressBar } from "./order-progress-bar";
import { RestaurantMap } from "./restaurant-map";

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

export function OrderStatusClient({ initialData }: OrderStatusClientProps) {
  const {
    orderId,
    restaurantName,
    restaurantLatitude,
    restaurantLongitude,
    restaurantAddress,
    deliveryAddress,
    deliveryTime,
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
  const { isConnected, getOrderStatus } = useOrderStatus({
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

  // 배달 중일 때 도착 예정 시간 계산
  const estimatedArrival = useMemo(() => {
    if (currentStatus !== "PICKED_UP") return null;

    // 주문 생성 시간 + 예상 배달 시간 기준으로 남은 시간 추정
    const orderTime = new Date(createdAt).getTime();
    const estimatedEndTime = orderTime + deliveryTime * 60 * 1000;
    const now = Date.now();
    const remainingMs = estimatedEndTime - now;

    if (remainingMs <= 0) {
      return "곧 도착";
    }

    const remainingMin = Math.ceil(remainingMs / (60 * 1000));
    return `약 ${remainingMin}분`;
  }, [currentStatus, createdAt, deliveryTime]);

  const dateStr = new Date(createdAt).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col min-h-dvh bg-muted/30">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center h-12 px-4">
          <Link
            href={`/orders/${orderId}`}
            className="mr-3 p-1"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-base font-semibold">주문 상태</h1>
          {/* 실시간 연결 표시 */}
          <div className="ml-auto flex items-center gap-1.5">
            <div
              className={`size-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-muted-foreground/40"
              }`}
            />
            <span className="text-[10px] text-muted-foreground">
              {isConnected ? "실시간" : "연결중"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 pb-6">
        {/* 주문 상태 프로그레스 바 */}
        <div className="bg-background px-4">
          <OrderProgressBar status={currentStatus} />

          {/* 배달 중 도착 예정 시간 */}
          {currentStatus === "PICKED_UP" && estimatedArrival && (
            <div className="pb-4 -mt-1">
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
                <Clock className="size-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary">
                    도착 예정 {estimatedArrival}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    라이더가 음식을 배달하고 있어요
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 배달 완료 */}
          {currentStatus === "DONE" && (
            <div className="pb-4 -mt-1">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
                <p className="text-sm font-semibold text-green-700">
                  배달이 완료되었습니다
                </p>
                <p className="text-xs text-green-600 mt-1">
                  맛있게 드세요!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 카카오 맵 - 음식점 위치 */}
        <div className="bg-background mt-2 px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Store className="size-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">음식점 위치</h3>
          </div>
          <RestaurantMap
            latitude={restaurantLatitude}
            longitude={restaurantLongitude}
            restaurantName={restaurantName}
          />
          {restaurantAddress && (
            <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
              <MapPin className="size-3 mt-0.5 flex-shrink-0" />
              {restaurantAddress}
            </p>
          )}
        </div>

        {/* 주문 정보 요약 */}
        <div className="bg-background mt-2 px-4 py-4">
          <h3 className="font-semibold text-sm mb-3">{restaurantName}</h3>
          <p className="text-xs text-muted-foreground mb-3">{dateStr}</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-sm"
              >
                <span>
                  {item.menuName}
                  <span className="text-muted-foreground ml-1">
                    {item.quantity}개
                  </span>
                </span>
                <span className="font-medium">
                  {(item.price * item.quantity).toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-semibold text-sm">
            <span>총 결제금액</span>
            <span className="text-primary">
              {totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 배달 주소 */}
        <div className="bg-background mt-2 px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="size-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">배달 주소</h3>
          </div>
          <p className="text-sm text-muted-foreground pl-6">
            {deliveryAddress}
          </p>
        </div>

        {/* 주문 상세 보기 링크 */}
        <div className="px-4 mt-4">
          <Link
            href={`/orders/${orderId}`}
            className="block w-full text-center py-3 bg-background border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            주문 상세 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
