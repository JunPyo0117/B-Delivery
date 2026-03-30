"use client";

interface ChatBubbleProps {
  content: string;
  timestamp: string;
  isMe: boolean;
  isRead: boolean;
  showTime?: boolean;
  showSender?: boolean;
  senderName?: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour12}:${m}`;
}

export function ChatBubble({
  content,
  timestamp,
  isMe,
  isRead,
  showTime = true,
  showSender = false,
  senderName,
}: ChatBubbleProps) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} px-4 mb-1.5`}>
      {/* 상대방: 아바타 */}
      {!isMe && (
        <div className="mr-2 shrink-0 mt-0.5">
          {showSender ? (
            <div className="size-8 rounded-full bg-[#E8E8E8] flex items-center justify-center">
              <span className="text-[11px] font-bold text-gray-500">CS</span>
            </div>
          ) : (
            <div className="size-8" />
          )}
        </div>
      )}

      <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
        {/* 상대방 이름 */}
        {!isMe && showSender && (
          <span className="text-[12px] font-medium text-gray-600 mb-1 ml-1">
            {senderName || "상담사"}
          </span>
        )}

        <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}>
          {/* 메시지 버블 */}
          <div
            className={`px-3.5 py-2.5 text-[14px] leading-5 break-words ${
              isMe
                ? "bg-[#2DB400] text-white rounded-[16px_4px_16px_16px]"
                : "bg-[#F2F2F2] text-gray-900 rounded-[4px_16px_16px_16px]"
            }`}
          >
            <p className="whitespace-pre-wrap">{content}</p>
          </div>

          {/* 시간 + 읽음 */}
          {showTime && (
            <div
              className={`flex flex-col shrink-0 gap-0.5 ${isMe ? "items-end" : "items-start"}`}
            >
              {isMe && isRead && (
                <span className="text-[10px] text-gray-400">읽음</span>
              )}
              {isMe && !isRead && (
                <span className="text-[10px] font-bold text-amber-500">1</span>
              )}
              <span className="text-[10px] text-gray-400">{formatTime(timestamp)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
