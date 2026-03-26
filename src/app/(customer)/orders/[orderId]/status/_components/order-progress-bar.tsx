"use client";

import { CircleX } from "lucide-react";
import type { OrderStatus } from "@/types/order";

const ORDER_STEPS = [
  { status: "PENDING" as const, label: "주문접수" },
  { status: "COOKING" as const, label: "조리중" },
  { status: "PICKED_UP" as const, label: "배달중" },
  { status: "DONE" as const, label: "배달완료" },
];

interface OrderProgressBarProps {
  status: OrderStatus;
}

export function OrderProgressBar({ status }: OrderProgressBarProps) {
  const isCancelled = status === "CANCELLED";
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.status === status);

  if (isCancelled) {
    return (
      <div className="flex flex-col items-center gap-2 text-gray-400 py-6">
        <CircleX className="size-12 text-gray-300" />
        <p className="text-[16px] font-bold text-gray-500">주문이 취소되었습니다</p>
      </div>
    );
  }

  return (
    <div className="py-6 px-2">
      {/* 단계 인디케이터 */}
      <div className="flex items-center justify-between relative">
        {/* 연결선 (배경) */}
        <div className="absolute top-[10px] left-[10px] right-[10px] h-[2px] bg-gray-200 z-0" />
        {/* 연결선 (진행) */}
        <div
          className="absolute top-[10px] left-[10px] h-[2px] z-[1] transition-all duration-500"
          style={{
            backgroundColor: "#2DB400",
            width: currentStepIndex >= 0
              ? `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%`
              : "0%",
            maxWidth: "calc(100% - 20px)",
          }}
        />

        {ORDER_STEPS.map((step, idx) => {
          const isCompleted = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div key={step.status} className="flex flex-col items-center z-10">
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
  );
}
