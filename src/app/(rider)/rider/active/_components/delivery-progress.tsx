"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  ArrowDown,
  Package,
  Truck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/shared/lib";
import {
  updateDeliveryStatus,
  updateRiderLocation,
} from "../../../_actions/rider-actions";

type DeliveryStatus = "REQUESTED" | "ACCEPTED" | "AT_STORE" | "PICKED_UP" | "DELIVERING" | "DONE" | "CANCELLED";

interface DeliveryProgressProps {
  deliveryId: string;
  currentStatus: DeliveryStatus;
}

/** 배달 상태 단계 정의 */
const STEPS = [
  {
    status: "ACCEPTED" as DeliveryStatus,
    label: "배달 수락",
    icon: ArrowDown,
    nextLabel: null,
  },
  {
    status: "AT_STORE" as DeliveryStatus,
    label: "가게 도착",
    icon: Store,
    nextLabel: "가게 도착",
  },
  {
    status: "PICKED_UP" as DeliveryStatus,
    label: "픽업 완료",
    icon: Package,
    nextLabel: "픽업 완료",
  },
  {
    status: "DELIVERING" as DeliveryStatus,
    label: "배달 중",
    icon: Truck,
    nextLabel: "배달 출발",
  },
  {
    status: "DONE" as DeliveryStatus,
    label: "배달 완료",
    icon: CheckCircle2,
    nextLabel: "배달 완료",
  },
] as const;

/**
 * 배달 진행 상태 컴포넌트
 *
 * - 단계별 상태 표시 (수락 -> 가게도착 -> 픽업 -> 배달중 -> 완료)
 * - 다음 단계 버튼
 * - 5초마다 위치 전송
 */
export function DeliveryProgress({
  deliveryId,
  currentStatus: initialStatus,
}: DeliveryProgressProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] =
    useState<DeliveryStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 현재 단계 인덱스
  const currentStepIndex = STEPS.findIndex(
    (step) => step.status === currentStatus
  );

  // 다음 단계
  const nextStep =
    currentStepIndex < STEPS.length - 1
      ? STEPS[currentStepIndex + 1]
      : null;

  // 5초마다 위치 전송
  useEffect(() => {
    if (currentStatus === "DONE") return;

    let watchId: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (navigator.geolocation) {
      // 초기 위치 전송
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateRiderLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // 위치 권한 거부 시 무시
        }
      );

      // 5초마다 위치 전송
      intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            updateRiderLocation(pos.coords.latitude, pos.coords.longitude);
          },
          () => {}
        );
      }, 5000);
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [currentStatus]);

  function handleNextStep() {
    if (!nextStep) return;
    setError(null);

    startTransition(async () => {
      const result = await updateDeliveryStatus(deliveryId, nextStep.status);
      if (result.error) {
        setError(result.error);
        return;
      }

      setCurrentStatus(nextStep.status);

      // 배달 완료 시 메인으로 이동
      if (nextStep.status === "DONE") {
        setTimeout(() => {
          router.push("/rider");
          router.refresh();
        }, 1500);
      }
    });
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
      <h2 className="text-[15px] font-bold text-gray-900 mb-4">배달 진행</h2>

      {/* 단계별 표시 */}
      <div className="flex items-center justify-between mb-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.status} className="flex flex-col items-center flex-1">
              {/* 연결선 */}
              {index > 0 && (
                <div
                  className={cn(
                    "absolute h-0.5 w-full -translate-y-3",
                    isCompleted ? "bg-[#2DB400]" : "bg-gray-200"
                  )}
                  style={{ display: "none" }}
                />
              )}

              {/* 아이콘 */}
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full transition-colors",
                  isCompleted
                    ? "bg-[#2DB400] text-white"
                    : "bg-gray-100 text-gray-400",
                  isCurrent && "ring-2 ring-[#2DB400]/30"
                )}
              >
                <Icon className="size-5" />
              </div>

              {/* 라벨 */}
              <p
                className={cn(
                  "text-[10px] mt-1.5 text-center",
                  isCompleted
                    ? "text-[#2DB400] font-semibold"
                    : "text-gray-400"
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* 연결선 (단계 사이) */}
      <div className="flex items-center gap-0 -mt-[52px] mb-6 px-5">
        {STEPS.slice(1).map((step, index) => {
          const isCompleted = index + 1 <= currentStepIndex;
          return (
            <div
              key={`line-${step.status}`}
              className={cn(
                "flex-1 h-0.5",
                isCompleted ? "bg-[#2DB400]" : "bg-gray-200"
              )}
            />
          );
        })}
      </div>

      {/* 에러 */}
      {error && (
        <p className="text-[12px] text-[#FF5252] text-center mb-3">{error}</p>
      )}

      {/* 다음 단계 버튼 */}
      {nextStep ? (
        <button
          type="button"
          onClick={handleNextStep}
          disabled={isPending}
          className={cn(
            "w-full rounded-xl py-3.5 text-[15px] font-semibold text-white transition-colors",
            "bg-[#2DB400] hover:bg-[#269900] active:bg-[#1F8000]",
            "disabled:bg-gray-200 disabled:text-gray-400"
          )}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              처리 중...
            </span>
          ) : (
            nextStep.nextLabel
          )}
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#2DB400]/10 py-3.5">
          <CheckCircle2 className="size-5 text-[#2DB400]" />
          <p className="text-[15px] font-semibold text-[#2DB400]">
            배달이 완료되었습니다!
          </p>
        </div>
      )}
    </div>
  );
}
