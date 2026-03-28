"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Store, Clock, Wallet, Loader2 } from "lucide-react";
import { cn, formatPrice, formatDistance } from "@/shared/lib";
import { acceptDelivery } from "../../_actions/rider-actions";

export interface DeliveryRequest {
  orderId: string;
  restaurantName: string;
  restaurantAddress: string;
  deliveryAddress: string;
  distance: number | null;
  estimatedTime: number | null;
  riderFee: number;
}

interface DeliveryRequestCardProps {
  request: DeliveryRequest;
  onDismiss: () => void;
}

/** 자동 거절 타이머 (초) */
const AUTO_REJECT_SECONDS = 30;

/**
 * 배달 요청 카드
 * - 가게명, 배달지, 거리, 예상 시간, 배달비 표시
 * - 수락/거절 버튼
 * - 30초 타이머 후 자동 거절
 */
export function DeliveryRequestCard({
  request,
  onDismiss,
}: DeliveryRequestCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REJECT_SECONDS);
  const [error, setError] = useState<string | null>(null);

  // 알림음 + 진동
  useEffect(() => {
    try {
      const audio = new Audio("/sounds/delivery-alert.mp3");
      audio.play().catch(() => {});
    } catch {}
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {}
  }, []);

  // 자동 거절 타이머
  useEffect(() => {
    if (secondsLeft <= 0) {
      onDismiss();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft, onDismiss]);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptDelivery(request.orderId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/rider/active");
      router.refresh();
    });
  }

  function handleReject() {
    onDismiss();
  }

  const timerPercentage = (secondsLeft / AUTO_REJECT_SECONDS) * 100;

  return (
    <div className="rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* 타이머 바 */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-[#2DB400] transition-all duration-1000 ease-linear"
          style={{ width: `${timerPercentage}%` }}
        />
      </div>

      <div className="p-4">
        {/* 헤더: 새 배달 요청 + 남은 시간 */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[15px] font-bold text-gray-900">
            새 배달 요청
          </p>
          <span className="text-[13px] font-medium text-[#2DB400]">
            {secondsLeft}초
          </span>
        </div>

        {/* 가게 정보 */}
        <div className="flex items-start gap-2 mb-2">
          <Store className="size-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-gray-900">
              {request.restaurantName}
            </p>
            <p className="text-[12px] text-gray-500">
              {request.restaurantAddress}
            </p>
          </div>
        </div>

        {/* 배달지 */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="size-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[14px] font-medium text-gray-900">배달지</p>
            <p className="text-[12px] text-gray-500">
              {request.deliveryAddress}
            </p>
          </div>
        </div>

        {/* 거리, 예상 시간, 배달비 */}
        <div className="flex items-center gap-4 mb-4 text-[13px] text-gray-600">
          {request.distance != null && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {formatDistance(request.distance)}
            </span>
          )}
          {request.estimatedTime != null && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {request.estimatedTime}분
            </span>
          )}
          <span className="flex items-center gap-1 font-semibold text-[#2DB400]">
            <Wallet className="size-3.5" />
            {formatPrice(request.riderFee)}
          </span>
        </div>

        {/* 에러 */}
        {error && (
          <p className="text-[12px] text-[#FF5252] text-center mb-3">
            {error}
          </p>
        )}

        {/* 수락/거절 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleReject}
            disabled={isPending}
            className="rounded-xl border border-gray-200 bg-white py-3 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
          >
            거절
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={isPending}
            className={cn(
              "rounded-xl py-3 text-[14px] font-semibold text-white transition-colors",
              "bg-[#2DB400] hover:bg-[#269900] active:bg-[#1F8000]",
              "disabled:bg-gray-200 disabled:text-gray-400"
            )}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                수락 중...
              </span>
            ) : (
              "수락"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
