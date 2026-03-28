"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, Send } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib"

interface ChatInputProps {
  onSend: (type: "TEXT" | "IMAGE", content: string) => void
  onTypingStart?: () => void
  onTypingStop?: () => void
  disabled?: boolean
  className?: string
}

/**
 * 채팅 입력 컴포넌트
 * - Enter 전송, Shift+Enter 줄바꿈
 * - 이미지 첨부(camera), 전송 버튼
 */
export function ChatInput({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
  className,
}: ChatInputProps) {
  const [text, setText] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      onTypingStart?.()
    }

    // 타이핑 중지 디바운스
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      onTypingStop?.()
    }, 2000)
  }, [onTypingStart, onTypingStop])

  const handleSendText = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return

    onSend("TEXT", trimmed)
    setText("")

    // 타이핑 중지
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (isTypingRef.current) {
      isTypingRef.current = false
      onTypingStop?.()
    }

    // textarea 높이 초기화
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [text, onSend, onTypingStop])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendText()
      }
    },
    [handleSendText]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value)
      handleTyping()

      // textarea 높이 자동 조절
      const textarea = e.target
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    },
    [handleTyping]
  )

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      try {
        // 1. Presigned URL 획득
        const presignedRes = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "chat",
            contentType: file.type,
            fileSize: file.size,
          }),
        })

        if (!presignedRes.ok) {
          const data = await presignedRes.json()
          throw new Error(data.error ?? "업로드 URL 생성 실패")
        }

        const { uploadUrl, publicUrl } = await presignedRes.json()

        // 2. MinIO에 직접 업로드
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })

        if (!uploadRes.ok) {
          throw new Error("이미지 업로드 실패")
        }

        // 3. 이미지 메시지 전송
        onSend("IMAGE", publicUrl)
      } catch (err) {
        console.error("[ChatInput] 이미지 업로드 실패:", err)
      } finally {
        setUploading(false)
        // input 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    },
    [onSend]
  )

  return (
    <div
      className={cn(
        "flex items-end gap-2 border-t bg-white p-3 dark:border-gray-800 dark:bg-gray-950",
        className
      )}
    >
      {/* 이미지 첨부 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/webp,image/jpeg,image/png,image/gif"
        className="hidden"
        onChange={handleImageUpload}
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="shrink-0 text-gray-500"
      >
        <Camera className="size-5" />
      </Button>

      {/* 텍스트 입력 */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
        rows={1}
        disabled={disabled}
        className="max-h-[120px] min-h-[36px] flex-1 resize-none rounded-xl border bg-gray-50 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-300 dark:border-gray-700 dark:bg-gray-900"
      />

      {/* 전송 버튼 */}
      <Button
        type="button"
        size="icon"
        onClick={handleSendText}
        disabled={disabled || !text.trim() || uploading}
        className="shrink-0"
      >
        <Send className="size-4" />
      </Button>
    </div>
  )
}
