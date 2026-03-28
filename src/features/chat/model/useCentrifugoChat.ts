"use client"

import { useEffect, useRef, useCallback, useState } from "react"
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
 * - 연결 상태 (isConnected, isConnecting, error)
 * - sendMessage, sendTyping 헬퍼
 */
export function useCentrifugoChat({
  chatId,
  onMessage,
  onTyping,
  onRead,
}: UseCentrifugoChatOptions) {
  const centrifugeRef = useRef<Centrifuge | null>(null)
  const subRef = useRef<Subscription | null>(null)

  // 연결 상태
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError("실시간 서버 URL이 설정되지 않았습니다.")
      return
    }

    setIsConnecting(true)
    setError(null)

    const centrifuge = new Centrifuge(wsUrl, {
      getToken: async () => {
        const res = await fetch("/api/chat/token", { method: "POST" })
        if (!res.ok) throw new Error("Centrifugo 토큰 발급 실패")
        const data = await res.json()
        return data.token as string
      },
    })

    centrifugeRef.current = centrifuge

    // 연결 상태 이벤트 핸들링
    centrifuge.on("connected", () => {
      setIsConnected(true)
      setIsConnecting(false)
      setError(null)
    })

    centrifuge.on("disconnected", () => {
      setIsConnected(false)
    })

    centrifuge.on("error", (ctx) => {
      setError(ctx.error?.message ?? "연결 오류가 발생했습니다.")
      setIsConnecting(false)
    })

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
      setIsConnected(false)
      setIsConnecting(false)
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

  /** 메시지 전송 RPC */
  const sendMessage = useCallback(
    async (type: "TEXT" | "IMAGE", content: string) => {
      const c = centrifugeRef.current
      if (!c || !chatId) return
      try {
        await c.rpc("message:send", { chatId, type, content })
      } catch (err) {
        console.error("[useCentrifugoChat] sendMessage 실패:", err)
      }
    },
    [chatId]
  )

  /** 타이핑 상태 전송 (시작/중지 통합 헬퍼) */
  const sendTyping = useCallback(
    async (isTyping: boolean) => {
      const c = centrifugeRef.current
      if (!c || !chatId) return
      try {
        await c.rpc(isTyping ? "typing:start" : "typing:stop", { chatId })
      } catch {
        // 타이핑 이벤트 실패는 무시
      }
    },
    [chatId]
  )

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    sendTyping,
    sendTypingStart,
    sendTypingStop,
    sendMessageRead,
  }
}
