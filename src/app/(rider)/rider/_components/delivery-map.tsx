"use client";

import { MapPin } from "lucide-react";

/**
 * 지도 플레이스홀더
 * - 추후 카카오맵 연동 예정
 */
export function DeliveryMap() {
  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 h-[200px] overflow-hidden">
      {/* 그리드 패턴 배경 */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, #d1d5db 1px, transparent 1px), linear-gradient(to bottom, #d1d5db 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
          <MapPin className="size-6 text-[#2DB400]" />
        </div>
        <p className="text-[13px] text-gray-500">
          지도 연동 예정
        </p>
        <p className="text-[11px] text-gray-400">
          카카오맵 API 연결 후 활성화됩니다
        </p>
      </div>
    </div>
  );
}
