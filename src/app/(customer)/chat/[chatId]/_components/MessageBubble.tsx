"use client";

import { useState } from "react";
import type { PendingMessage } from "@/types/chat";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface MessageBubbleProps {
  message: PendingMessage;
  isOwn: boolean;
  showTime: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${hour12}:${m}`;
}

export function MessageBubble({ message, isOwn, showTime }: MessageBubbleProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const isPending = message._pending;

  return (
    <>
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 mb-1`}>
        <div className={`flex items-end gap-1 max-w-[75%] ${isOwn ? "flex-row-reverse" : ""}`}>
          {/* 메시지 본문 */}
          <div
            className={`rounded-2xl px-3 py-2 text-sm break-words ${
              isPending ? "opacity-60" : ""
            } ${
              isOwn
                ? "bg-[#FFE5A0] text-gray-900 rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm"
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
            <div className={`flex flex-col text-[10px] text-gray-400 shrink-0 ${isOwn ? "items-end" : "items-start"}`}>
              {isOwn && !message.isRead && !isPending && (
                <span className="text-[#2AC1BC]">1</span>
              )}
              <span>{formatTime(message.createdAt)}</span>
            </div>
          )}
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
