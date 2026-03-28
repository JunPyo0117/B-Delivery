"use client"

import type { OrderStatus } from "@/generated/prisma/client"
import { ORDER_STATUS_STEPS, ORDER_STATUS_LABELS } from "@/entities/order"
import { cn } from "@/lib/utils"

interface OrderProgressBarProps {
  currentStatus: OrderStatus
  className?: string
}

/** 주문 진행 상태를 6단계 프로그레스 바로 표시 */
export function OrderProgressBar({ currentStatus, className }: OrderProgressBarProps) {
  const isCancelled = currentStatus === "CANCELLED"
  const currentIndex = ORDER_STATUS_STEPS.indexOf(currentStatus)

  if (isCancelled) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* 취소 상태 표시 */}
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
            <XIcon />
          </div>
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            {ORDER_STATUS_LABELS.CANCELLED}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* 현재 상태 라벨 */}
      <p className="text-center text-sm font-medium text-gray-900 dark:text-gray-100">
        {ORDER_STATUS_LABELS[currentStatus]}
      </p>

      {/* 프로그레스 바 */}
      <div className="flex items-center gap-1">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isDone = step === "DONE" && currentStatus === "DONE"

          return (
            <div key={step} className="flex flex-1 flex-col items-center gap-1">
              {/* 단계 인디케이터 */}
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-700"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                )}
              >
                {isCompleted || isDone ? <CheckIcon /> : index + 1}
              </div>

              {/* 단계 라벨 */}
              <span
                className={cn(
                  "text-center text-[10px] leading-tight",
                  isCompleted || isCurrent
                    ? "font-medium text-gray-900 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-500"
                )}
              >
                {STEP_SHORT_LABELS[step]}
              </span>
            </div>
          )
        })}
      </div>

      {/* 연결선 */}
      <div className="mx-3 flex items-center gap-1">
        {ORDER_STATUS_STEPS.slice(0, -1).map((step, index) => {
          const isCompleted = index < currentIndex
          return (
            <div
              key={`line-${step}`}
              className={cn(
                "h-0.5 flex-1 rounded-full transition-colors",
                isCompleted
                  ? "bg-green-500"
                  : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

/** 프로그레스 바 단계별 짧은 라벨 */
const STEP_SHORT_LABELS: Record<string, string> = {
  PENDING: "접수",
  COOKING: "조리중",
  WAITING_RIDER: "기사 대기",
  RIDER_ASSIGNED: "기사 배정",
  PICKED_UP: "배달중",
  DONE: "완료",
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  )
}
