"use client";

import { CheckCircle2, Clock, ChefHat, Truck, CircleX } from "lucide-react";
import type { OrderStatus } from "@/types/order";

const ORDER_STEPS = [
  { status: "PENDING" as const, label: "주문 접수", icon: Clock },
  { status: "COOKING" as const, label: "조리중", icon: ChefHat },
  { status: "PICKED_UP" as const, label: "배달 중", icon: Truck },
  { status: "DONE" as const, label: "배달 완료", icon: CheckCircle2 },
];

interface OrderProgressBarProps {
  status: OrderStatus;
}

export function OrderProgressBar({ status }: OrderProgressBarProps) {
  const isCancelled = status === "CANCELLED";
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.status === status);

  if (isCancelled) {
    return (
      <div className="flex flex-col items-center gap-2 text-muted-foreground py-6">
        <CircleX className="size-12 text-muted-foreground/60" />
        <p className="text-lg font-semibold">주문이 취소되었습니다</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <p className="text-center text-lg font-semibold mb-6">
        {ORDER_STEPS[currentStepIndex]?.label ?? status}
      </p>

      {/* 아이콘 단계 */}
      <div className="flex items-center justify-between px-2">
        {ORDER_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={step.status}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              <div
                className={`size-11 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                } ${isCurrent ? "ring-2 ring-primary ring-offset-2 scale-110" : ""}`}
              >
                <Icon className="size-5" />
              </div>
              <span
                className={`text-[11px] transition-colors duration-300 ${
                  isCompleted
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 프로그레스 바 */}
      <div className="mx-10 mt-3 flex gap-1">
        {ORDER_STEPS.slice(0, -1).map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
              idx < currentStepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
