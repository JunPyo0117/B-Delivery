"use client";

import { useState, useTransition } from "react";
import { OrderStatus } from "@/generated/prisma/enums";
import { OrderStatusBadge } from "./order-status-badge";
import { updateOrderStatus } from "../_actions/update-order-status";
import type { OwnerOrder } from "../_actions/get-orders";

/** 다음 상태 전이 정보 */
const NEXT_STATUS: Partial<
  Record<OrderStatus, { status: OrderStatus; label: string }>
> = {
  PENDING: { status: OrderStatus.COOKING, label: "주문 수락" },
  COOKING: { status: OrderStatus.PICKED_UP, label: "픽업 완료" },
  PICKED_UP: { status: OrderStatus.DONE, label: "배달 완료" },
};

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

/** 경과 시간 표시 */
function getElapsedTime(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

interface OrderCardProps {
  order: OwnerOrder;
  onStatusChange?: () => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextAction = NEXT_STATUS[order.status];

  function handleStatusChange(newStatus: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus);
      if (!result.success) {
        setError(result.error ?? "상태 변경에 실패했습니다.");
      } else {
        onStatusChange?.();
      }
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, OrderStatus.CANCELLED);
      if (!result.success) {
        setError(result.error ?? "주문 취소에 실패했습니다.");
      } else {
        onStatusChange?.();
      }
    });
  }

  const itemsSummary = order.items
    .map((item) => `${item.menuName} x${item.quantity}`)
    .join(", ");

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
      {/* 헤더: 주문번호 + 상태 뱃지 */}
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-gray-900">
          주문 #{order.id.slice(-4).toUpperCase()}
        </span>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* 주문 항목 요약 */}
      <p className="text-sm text-gray-500 line-clamp-1">{itemsSummary}</p>

      {/* 가격 + 시간 */}
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-gray-900">
          {formatPrice(order.totalPrice)}
        </span>
        <span className="text-xs text-gray-400">
          {getElapsedTime(order.createdAt)}
        </span>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p
          className="text-xs font-medium rounded-lg p-2"
          style={{ backgroundColor: "#FFEBEE", color: "#FF5252" }}
        >
          {error}
        </p>
      )}

      {/* 액션 버튼 */}
      {(nextAction || order.status === "PENDING") && (
        <div className="flex gap-2 pt-1">
          {order.status === "PENDING" && (
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{
                borderColor: "#FF5252",
                color: "#FF5252",
              }}
            >
              주문 거절
            </button>
          )}
          {nextAction && (
            <button
              onClick={() => handleStatusChange(nextAction.status)}
              disabled={isPending}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#2DB400" }}
            >
              {isPending ? "처리중..." : nextAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
