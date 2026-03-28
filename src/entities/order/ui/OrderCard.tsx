"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { OrderCardData } from "../model/types"
import { OrderStatusBadge } from "./OrderStatusBadge"

interface OrderCardProps {
  order: OrderCardData
  onReview?: (orderId: string) => void
  onReorder?: (orderId: string) => void
  onDetail?: (orderId: string) => void
  className?: string
}

function formatDate(date: Date): string {
  const d = new Date(date)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
  const weekday = weekdays[d.getDay()]
  return `${month}월 ${day}일 (${weekday})`
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원"
}

function summarizeItems(order: OrderCardData): string {
  if (order.items.length === 0) return ""
  const first = order.items[0]
  const rest = order.items.length - 1
  const firstText = `${first.menuName} ${first.quantity}개`
  return rest > 0 ? `${firstText} 외 ${rest}개` : firstText
}

export function OrderCard({
  order,
  onReview,
  onReorder,
  onDetail,
  className,
}: OrderCardProps) {
  const isDone = order.status === "DONE"
  const isCancelled = order.status === "CANCELLED"

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-950",
        className
      )}
    >
      {/* 날짜 + 주문상세 링크 */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {formatDate(order.createdAt)}
        </span>
        <button
          onClick={() => onDetail?.(order.id)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          주문상세 &gt;
        </button>
      </div>

      {/* 음식점 정보 + 아이템 요약 */}
      <div className="mb-3 flex gap-3">
        {order.restaurantImageUrl ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={order.restaurantImageUrl}
              alt={order.restaurantName}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <span className="text-xl text-gray-400">🍽️</span>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
            {order.restaurantName}
          </h3>
          <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
            {summarizeItems(order)}
          </p>
        </div>

        <OrderStatusBadge status={order.status} className="shrink-0 self-start" />
      </div>

      {/* 결제 금액 */}
      <div className="mb-3 flex items-center justify-between border-t pt-3 dark:border-gray-800">
        <span className="text-sm text-gray-600 dark:text-gray-400">결제금액</span>
        <span className="text-base font-bold text-gray-900 dark:text-gray-100">
          {formatPrice(order.totalPrice)}
        </span>
      </div>

      {/* 완료 시 액션 버튼 */}
      {isDone && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onReorder?.(order.id)}
          >
            같은 메뉴 담기
          </Button>
          {!order.hasReview && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onReview?.(order.id)}
            >
              리뷰 작성
            </Button>
          )}
        </div>
      )}

      {/* 취소된 주문 */}
      {isCancelled && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          주문이 취소되었습니다
        </div>
      )}
    </div>
  )
}
