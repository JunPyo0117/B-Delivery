"use client"

import { useEffect, useRef, useCallback } from "react"
import { Centrifuge, Subscription } from "centrifuge"
import type { ChatMessageResponse, TypingEvent, ReadReceiptEvent } from "@/types/chat"

interface UseCentrifugoChatOptions {
  chatId: string | undefined
  onMessage?: (message: ChatMessageResponse) => void
  onTyping?: (event: TypingEvent) => void
  onRead?: (event: ReadReceiptEvent) => void
}

/**
 * Centrifugo 채팅 실시간 구독 훅
 * - chat:<chatId> 채널 구독
 * - 새 메시지 수신 콜백
 * - RPC typing:start/stop, message:read
 */
export function useCentrifugoChat({
  chatId,
  onMessage,
  onTyping,
  onRead,
}: UseCentrifugoChatOptions) {
  const centrifugeRef = useRef<Centrifuge | null>(null)
  const subRef = useRef<Subscription | null>(null)

  // 콜백 refs (re-render 시 재구독 방지)
  const onMessageRef = useRef(onMessage)
  const onTypingRef = useRef(onTyping)
  const onReadRef = useRef(onRead)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    onTypingRef.current = onTyping
  }, [onTyping])

  useEffect(() => {
    onReadRef.current = onRead
  }, [onRead])

  useEffect(() => {
    if (!chatId) return

    const wsUrl = process.env.NEXT_PUBLIC_CENTRIFUGO_URL
    if (!wsUrl) {
      console.warn("[useCentrifugoChat] NEXT_PUBLIC_CENTRIFUGO_URL이 설정되지 않았습니다.")
      return
    }

    const centrifuge = new Centrifuge(wsUrl, {
      getToken: async () => {
        const res = await fetch("/api/chat/token", { method: "POST" })
        if (!res.ok) throw new Error("Centrifugo 토큰 발급 실패")
        const data = await res.json()
        return data.token as string
      },
    })

    centrifugeRef.current = centrifuge

    const channel = `chat:${chatId}`
    const sub = centrifuge.newSubscription(channel)

    sub.on("publication", (ctx: { data: unknown }) => {
      const data = ctx.data as {
        type?: string
        message?: ChatMessageResponse
        typing?: TypingEvent
        read?: ReadReceiptEvent
      }

      if (data.type === "message" && data.message) {
        onMessageRef.current?.(data.message)
      } else if (data.type === "typing" && data.typing) {
        onTypingRef.current?.(data.typing)
      } else if (data.type === "read" && data.read) {
        onReadRef.current?.(data.read)
      }
    })

    sub.subscribe()
    subRef.current = sub
    centrifuge.connect()

    return () => {
      sub.unsubscribe()
      centrifuge.removeSubscription(sub)
      subRef.current = null
      centrifuge.disconnect()
      centrifugeRef.current = null
    }
  }, [chatId])

  /** 타이핑 시작 RPC */
  const sendTypingStart = useCallback(
    async (userId: string) => {
      const c = centrifugeRef.current
      if (!c || !chatId) return
      try {
        await c.rpc("typing:start", { chatId, userId })
      } catch {
        // 타이핑 이벤트 실패는 무시
      }
    },
    [chatId]
  )

  /** 타이핑 중지 RPC */
  const sendTypingStop = useCallback(
    async (userId: string) => {
      const c = centrifugeRef.current
      if (!c || !chatId) return
      try {
        await c.rpc("typing:stop", { chatId, userId })
      } catch {
        // 타이핑 이벤트 실패는 무시
      }
    },
    [chatId]
  )

  /** 메시지 읽음 RPC */
  const sendMessageRead = useCallback(
    async (userId: string) => {
      const c = centrifugeRef.current
      if (!c || !chatId) return
      try {
        await c.rpc("message:read", { chatId, userId })
      } catch {
        // 읽음 처리 실패는 무시
      }
    },
    [chatId]
  )

  return {
    sendTypingStart,
    sendTypingStop,
    sendMessageRead,
  }
}
