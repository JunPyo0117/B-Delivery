"use client";

import { useState } from "react";

export function BusinessHoursBanner() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mx-4 mt-3">
      <div className="rounded-xl bg-[#F5F5F5] px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 text-[13px] leading-5 text-gray-600">
            <p className="font-medium text-gray-700">배민 상담사 업무시간: 24시</p>
            {isOpen && (
              <p className="mt-0.5 text-gray-500">
                B마트 상담사 업무시간: 09:00 ~ 익일 01:00
              </p>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-3 shrink-0 text-[13px] text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors"
          >
            {isOpen ? "접기" : "펼치기"}
          </button>
        </div>
      </div>

      {isOpen && (
        <p className="mt-2 px-1 text-[11px] leading-4 text-gray-400">
          본인이 아닌 경우 상담이 제한될 수 있으며, 상담을 위하여 대화 내용은 저장됩니다.
        </p>
      )}
    </div>
  );
}
