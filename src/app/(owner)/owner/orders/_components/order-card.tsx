"use client";

import { useState, useTransition } from "react";
import { OrderStatus } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./order-status-badge";
import { updateOrderStatus } from "../_actions/update-order-status";
import type { OwnerOrder } from "../_actions/get-orders";

/** 다음 상태 전이 정보 */
const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  PENDING: { status: OrderStatus.COOKING, label: "주문 접수" },
  COOKING: { status: OrderStatus.PICKED_UP, label: "픽업 완료" },
  PICKED_UP: { status: OrderStatus.DONE, label: "배달 완료" },
};

function formatTime(isoString: string) {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

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

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3 shadow-sm">
      {/* 헤더: 상태 뱃지 + 시간 */}
      <div className="flex items-center justify-between">
        <OrderStatusBadge status={order.status} />
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {formatDate(order.createdAt)} {formatTime(order.createdAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            {getElapsedTime(order.createdAt)}
          </p>
        </div>
      </div>

      {/* 주문 번호 + 고객 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          주문번호: {order.id.slice(-8).toUpperCase()}
        </p>
        <p className="text-sm text-muted-foreground">
          {order.customerNickname}
        </p>
      </div>

      {/* 주문 항목 */}
      <div className="space-y-1 border-t pt-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span>
              {item.menuName} x {item.quantity}
            </span>
            <span className="text-muted-foreground">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* 총액 + 배달 주소 */}
      <div className="border-t pt-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">총 결제금액</span>
          <span className="text-sm font-bold text-primary">
            {formatPrice(order.totalPrice)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {order.deliveryAddress}
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded p-2">{error}</p>
      )}

      {/* 액션 버튼 */}
      {(nextAction || order.status === "PENDING") && (
        <div className="flex gap-2 pt-1">
          {order.status === "PENDING" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1"
            >
              주문 거절
            </Button>
          )}
          {nextAction && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(nextAction.status)}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? "처리중..." : nextAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
