"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, MapPin, MessageCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCentrifugoOrder } from "@/features/order/model/useCentrifugoOrder";
import { useOrderStore } from "@/features/order/model/orderStore";
import type { OrderStatus } from "@/types/order";
import { RestaurantMap } from "./restaurant-map";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";

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
  { key: "WAITING_RIDER", label: "기사매칭" },
  { key: "RIDER_ASSIGNED", label: "기사배정" },
  { key: "PICKED_UP", label: "배달중" },
  { key: "DONE", label: "배달완료" },
] as const;

const STATUS_EMOJI: Record<string, string> = {
  PENDING: "📋",
  COOKING: "🍳",
  WAITING_RIDER: "🔍",
  RIDER_ASSIGNED: "🏍️",
  PICKED_UP: "🛵",
  DONE: "✅",
  CANCELLED: "❌",
};

const STATUS_TITLE: Record<string, string> = {
  PENDING: "주문을 접수 중이에요",
  COOKING: "조리 중이에요",
  WAITING_RIDER: "배달기사를 찾고 있어요",
  RIDER_ASSIGNED: "배달기사가 배정되었어요",
  PICKED_UP: "배달 중이에요",
  DONE: "배달이 완료되었어요",
  CANCELLED: "주문이 취소되었습니다",
};

const STATUS_SUBTITLE: Record<string, string> = {
  PENDING: "음식점에서 주문을 확인하고 있어요",
  COOKING: "맛있게 준비하고 있으니 조금만 기다려 주세요",
  WAITING_RIDER: "배달기사를 찾고 있어요, 잠시만 기다려 주세요",
  RIDER_ASSIGNED: "곧 음식을 픽업할 예정이에요",
  PICKED_UP: "라이더가 음식을 배달하고 있어요",
  DONE: "맛있게 드세요!",
  CANCELLED: "주문이 정상적으로 취소 처리되었습니다",
};

/** USER 역할에서 취소 가능한 상태 */
const USER_CANCELLABLE_STATUSES: OrderStatus[] = ["PENDING", "COOKING"];

export function OrderStatusClient({ initialData }: OrderStatusClientProps) {
  const {
    orderId,
    restaurantName,
    restaurantLatitude,
    restaurantLongitude,
    deliveryAddress,
    deliveryTime,
    totalPrice,
    items,
  } = initialData;

  const router = useRouter();
  const setOrderStatus = useOrderStore((s) => s.setOrderStatus);

  // 취소 관련 상태
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Zustand 스토어 초기 설정
  useEffect(() => {
    setOrderStatus(orderId, initialData.status);
  }, [orderId, initialData.status, setOrderStatus]);

  // WebSocket 연결 - 실시간 상태 업데이트
  const { isConnected } = useCentrifugoOrder({
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
  const isCancelled = currentStatus === "CANCELLED";
  const canCancel = USER_CANCELLABLE_STATUSES.includes(currentStatus);

  // 주문 취소 핸들러
  const handleCancel = useCallback(async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "취소에 실패했습니다.");
        return;
      }

      // 스토어 업데이트
      setOrderStatus(orderId, "CANCELLED");
      setCancelDialogOpen(false);

      // 주문 내역 페이지로 이동
      router.push("/orders");
    } catch {
      alert("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsCancelling(false);
    }
  }, [orderId, setOrderStatus, router]);

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
        {/* 지도 영역 — RestaurantMap 컴포넌트 연동 */}
        <div className="relative">
          <RestaurantMap
            latitude={restaurantLatitude}
            longitude={restaurantLongitude}
            restaurantName={restaurantName}
          />
          {/* PICKED_UP 상태: 배달 중 오버레이 */}
          {currentStatus === "PICKED_UP" && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2 text-white text-[12px] font-semibold shadow-lg"
                style={{ backgroundColor: "#2DB400" }}
              >
                <span className="animate-pulse">🛵</span>
                <span>배달 중, 도착 예정 {deliveryTime}분</span>
              </div>
            </div>
          )}
        </div>

        {/* 상태 텍스트 */}
        <div className="bg-white px-4 py-6 text-center">
          {isCancelled ? (
            <>
              <p className="text-[20px] font-bold text-gray-900">
                {STATUS_TITLE.CANCELLED} {STATUS_EMOJI.CANCELLED}
              </p>
              <p className="text-[13px] text-gray-500 mt-1">
                {STATUS_SUBTITLE.CANCELLED}
              </p>
            </>
          ) : (
            <>
              <p className="text-[20px] font-bold text-gray-900">
                {currentStatus === "WAITING_RIDER" ? (
                  <span className="animate-pulse">
                    {STATUS_TITLE[currentStatus] ?? "주문 처리 중"}...
                  </span>
                ) : (
                  <>
                    {STATUS_TITLE[currentStatus] ?? "주문 처리 중"}{" "}
                    {STATUS_EMOJI[currentStatus] ?? ""}
                  </>
                )}
              </p>
              <p className="text-[13px] text-gray-500 mt-1">
                {STATUS_SUBTITLE[currentStatus] ?? ""}
              </p>
            </>
          )}
        </div>

        {/* 단계 인디케이터 or 취소 UI */}
        {isCancelled ? (
          /* 취소됨 상태 UI */
          <div className="bg-white px-6 pb-6 flex flex-col items-center gap-3">
            <XCircle className="size-12 text-gray-300" />
            <p className="text-[13px] text-gray-400">
              결제 금액은 영업일 기준 1~3일 내 환불 처리됩니다.
            </p>
            <Link
              href="/orders"
              className="mt-2 inline-flex items-center rounded-lg px-4 py-2 text-[13px] font-semibold text-white"
              style={{ backgroundColor: "#2DB400" }}
            >
              주문 내역으로 돌아가기
            </Link>
          </div>
        ) : (
          /* 6단계 프로그레스 바 */
          <div className="bg-white px-4 pb-6">
            <div className="flex items-center justify-between relative">
              {/* 연결선 (배경) */}
              <div className="absolute top-[10px] left-[10px] right-[10px] h-[2px] bg-gray-200 z-0" />
              {/* 연결선 (진행) */}
              <div
                className="absolute top-[10px] left-[10px] h-[2px] z-[1] transition-all duration-500"
                style={{
                  backgroundColor: "#2DB400",
                  width:
                    currentStepIndex >= 0
                      ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`
                      : "0%",
                  maxWidth: "calc(100% - 20px)",
                }}
              />

              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isWaitingRider =
                  isCurrent && step.key === "WAITING_RIDER";
                return (
                  <div key={step.key} className="flex flex-col items-center z-10">
                    {/* 원형 도트 */}
                    <div
                      className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted
                          ? "border-transparent"
                          : "border-gray-300 bg-white"
                      } ${isCurrent ? "scale-125" : ""} ${
                        isWaitingRider ? "animate-pulse" : ""
                      }`}
                      style={isCompleted ? { backgroundColor: "#2DB400" } : {}}
                    >
                      {isCompleted && (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    {/* 라벨 */}
                    <span
                      className={`text-[10px] mt-2 text-center whitespace-nowrap ${
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
        )}

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

        {/* 주문 취소 버튼 — PENDING/COOKING에서만 표시 */}
        {canCancel && !isCancelled && (
          <div className="px-4 mt-4">
            <Button
              variant="destructive"
              className="w-full h-11 text-[14px] font-semibold"
              onClick={() => setCancelDialogOpen(true)}
            >
              주문 취소
            </Button>
          </div>
        )}
      </div>

      {/* 주문 취소 확인 다이얼로그 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-[320px]">
          <DialogHeader>
            <DialogTitle>주문을 취소하시겠어요?</DialogTitle>
            <DialogDescription>
              {currentStatus === "COOKING"
                ? "조리가 시작된 후 취소 시 수수료가 발생할 수 있습니다."
                : "취소한 주문은 되돌릴 수 없습니다."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              돌아가기
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  취소 중...
                </>
              ) : (
                "주문 취소"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
