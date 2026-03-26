export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {/* 아바타 자리 */}
      <div className="size-8 rounded-full bg-[#E8E8E8] flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold text-gray-500">CS</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[12px] text-gray-400 ml-1">상담사가 입력 중...</span>
        <div className="flex items-center gap-1 px-3.5 py-2.5 rounded-[4px_16px_16px_16px] bg-[#F2F2F2]">
          <span className="size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="size-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
