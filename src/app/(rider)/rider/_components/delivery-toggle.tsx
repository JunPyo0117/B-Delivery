"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib";
import { toggleOnlineStatus } from "../../_actions/rider-actions";

interface DeliveryToggleProps {
  initialIsOnline: boolean;
}

/**
 * 온라인/오프라인 토글 스위치
 * - 온라인: 배달 요청 수신 가능
 * - 오프라인: 배달 요청 수신 불가
 */
export function DeliveryToggle({ initialIsOnline }: DeliveryToggleProps) {
  const [isOnline, setIsOnline] = useState(initialIsOnline);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleOnlineStatus();
      if (result.success && result.isOnline !== undefined) {
        setIsOnline(result.isOnline);
      }
    });
  }

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "size-3 rounded-full",
            isOnline ? "bg-[#2DB400]" : "bg-gray-300"
          )}
        />
        <div>
          <p className="text-[15px] font-semibold text-gray-900">
            {isOnline ? "온라인" : "오프라인"}
          </p>
          <p className="text-[12px] text-gray-500">
            {isOnline
              ? "배달 요청을 받을 수 있습니다"
              : "배달 요청을 받지 않습니다"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200",
          isOnline ? "bg-[#2DB400]" : "bg-gray-300",
          isPending && "opacity-60"
        )}
        role="switch"
        aria-checked={isOnline}
        aria-label={isOnline ? "오프라인으로 전환" : "온라인으로 전환"}
      >
        {isPending ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-4 animate-spin text-white" />
          </span>
        ) : (
          <span
            className={cn(
              "inline-block size-6 transform rounded-full bg-white shadow-md transition-transform duration-200",
              isOnline ? "translate-x-7" : "translate-x-1"
            )}
          />
        )}
      </button>
    </div>
  );
}
