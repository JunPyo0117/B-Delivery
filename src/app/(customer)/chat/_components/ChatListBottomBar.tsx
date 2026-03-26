"use client";

import { ImagePlus, ArrowUp } from "lucide-react";

export function ChatListBottomBar() {
  return (
    <div className="mt-auto sticky bottom-0 bg-white border-t border-gray-100 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2">
        {/* 이미지 아이콘 */}
        <button
          disabled
          className="p-2 text-gray-300"
          aria-label="이미지 전송"
        >
          <ImagePlus className="size-5" />
        </button>

        {/* 입력 필드 (비활성) */}
        <div className="flex-1 h-10 rounded-full bg-[#F5F5F5] flex items-center px-4">
          <span className="text-[14px] text-gray-400">
            현재는 텍스트 입력이 불가합니다.
          </span>
        </div>

        {/* 전송 버튼 */}
        <button
          disabled
          className="size-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0"
          aria-label="전송"
        >
          <ArrowUp className="size-4 text-white" />
        </button>
      </div>
    </div>
  );
}
