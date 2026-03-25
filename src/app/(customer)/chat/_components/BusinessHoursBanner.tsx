"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function BusinessHoursBanner() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mx-4 mt-3 rounded-lg border bg-amber-50 text-sm">
      <div className="flex items-start justify-between p-3">
        <div className="flex-1 text-gray-700">
          <p>배민 상담사 업무시간: 24시</p>
          {isOpen && (
            <p className="mt-0.5">
              B마트 상담사 업무시간: 09:00 ~ 익일 01:00
            </p>
          )}
          {isOpen && (
            <p className="mt-2 text-xs text-gray-500">
              본인이 아닌 경우 상담이 제한될 수 있으며, 상담을 위하여 대화 내용은
              저장됩니다.
            </p>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-2 shrink-0 text-xs text-gray-500 flex items-center gap-0.5"
        >
          {isOpen ? "접기" : "펼치기"}
          {isOpen ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
