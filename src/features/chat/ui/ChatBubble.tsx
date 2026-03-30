"use client"

import Image from "next/image"
import type { ChatMessageResponse } from "@/types/chat"
import { cn } from "@/shared/lib"

interface ChatBubbleProps {
  message: ChatMessageResponse
  isOwn: boolean
  /** 같은 발신자의 연속 메시지인지 (프로필 아이콘 생략) */
  isContinuous?: boolean
  className?: string
}

/** 시간 포맷: 오전/오후 HH:MM */
function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours < 12 ? "오전" : "오후"
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${period} ${displayHours}:${String(minutes).padStart(2, "0")}`
}

/**
 * 채팅 메시지 버블
 * - 내 메시지: 오른쪽, 상대: 왼쪽
 * - TEXT/IMAGE/SYSTEM 분기
 * - 시간(오전/오후), 읽음(1 표시)
 */
export function ChatBubble({
  message,
  isOwn,
  isContinuous = false,
  className,
}: ChatBubbleProps) {
  // SYSTEM 메시지
  if (message.type === "SYSTEM") {
    return (
      <div className={cn("flex justify-center py-2", className)}>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
        !isContinuous ? "mt-3" : "mt-0.5",
        className
      )}
    >
      {/* 상대방 닉네임 (연속 아닐 때만) */}
      {!isOwn && !isContinuous && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {message.nickname[0]}
        </div>
      )}
      {!isOwn && isContinuous && <div className="w-8 shrink-0" />}

      <div
        className={cn(
          "flex flex-col",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {/* 닉네임 (상대방, 연속 아닐 때만) */}
        {!isOwn && !isContinuous && (
          <span className="mb-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
            {message.nickname}
          </span>
        )}

        <div
          className={cn(
            "flex items-end gap-1",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* 메시지 본문 */}
          {message.type === "IMAGE" ? (
            <div className="relative h-48 w-48 overflow-hidden rounded-xl">
              <Image
                src={message.content}
                alt="첨부 이미지"
                fill
                className="object-cover"
                sizes="192px"
              />
            </div>
          ) : (
            <div
              className={cn(
                "max-w-[260px] rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words",
                isOwn
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              )}
            >
              {message.content}
            </div>
          )}

          {/* 시간 + 읽음 표시 */}
          <div
            className={cn(
              "flex shrink-0 flex-col text-[10px] text-gray-400",
              isOwn ? "items-end" : "items-start"
            )}
          >
            {isOwn && !message.isRead && (
              <span className="font-medium text-yellow-500">1</span>
            )}
            <span>{formatTime(message.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
