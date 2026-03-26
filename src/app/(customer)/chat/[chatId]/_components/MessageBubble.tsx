"use client";

import { useState } from "react";
import type { PendingMessage } from "@/types/chat";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface MessageBubbleProps {
  message: PendingMessage;
  isOwn: boolean;
  showTime: boolean;
  showSender?: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour12}:${m}`;
}

export function MessageBubble({ message, isOwn, showTime, showSender }: MessageBubbleProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isPending = message._pending;

  // 시스템 메시지
  if (message.senderId === "__system__") {
    return (
      <div className="flex justify-center px-4 py-1.5">
        <p className="text-[12px] text-gray-400 text-center">{message.content}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 mb-1.5`}>
        {/* 상대방: 아바타 */}
        {!isOwn && (
          <div className="mr-2 shrink-0 mt-0.5">
            {showSender ? (
              <div className="size-8 rounded-full bg-[#E8E8E8] flex items-center justify-center">
                <span className="text-[11px] font-bold text-gray-500">CS</span>
              </div>
            ) : (
              <div className="size-8" /> /* 자리 유지 */
            )}
          </div>
        )}

        <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
          {/* 상대방 이름 */}
          {!isOwn && showSender && (
            <span className="text-[12px] font-medium text-gray-600 mb-1 ml-1">
              {message.nickname || "상담사"}
            </span>
          )}

          <div className={`flex items-end gap-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
            {/* 메시지 버블 */}
            <div
              className={`px-3.5 py-2.5 text-[14px] leading-5 break-words ${
                isPending ? "opacity-50" : ""
              } ${
                isOwn
                  ? "bg-[#2DB400] text-white rounded-[16px_4px_16px_16px]"
                  : "bg-[#F2F2F2] text-gray-900 rounded-[4px_16px_16px_16px]"
              }`}
            >
              {message.type === "IMAGE" ? (
                <button onClick={() => setPreviewOpen(true)} className="block">
                  <img
                    src={message.content}
                    alt="이미지"
                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                    loading="lazy"
                  />
                </button>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>

            {/* 시간 + 읽음 */}
            {showTime && (
              <div className={`flex flex-col shrink-0 gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && !message.isRead && !isPending && (
                  <span className="text-[10px] font-bold text-amber-500">1</span>
                )}
                {isOwn && !message.isRead && !isPending && (
                  <span className="text-[10px] font-bold text-amber-500">1</span>
                )}
                <span className="text-[10px] text-gray-400">
                  {formatTime(message.createdAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewOpen && (
        <ImagePreviewModal
          src={message.content}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
