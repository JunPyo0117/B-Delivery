"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Centrifuge } from "centrifuge"
import type { OrderStatus } from "@/generated/prisma/client"
import { useOrderStore } from "./orderStore"

/**
 * Centrifugo 주문 상태 실시간 구독 훅
 * - `/api/chat/token`에서 JWT 획득
 * - Connect proxy 방식으로 연결
 * - `order#<userId>` 채널은 서버 사이드 구독으로 자동 할당
 * - 수신된 주문 상태 변경 이벤트를 orderStore에 반영
 */
export function useCentrifugoOrder(
  userId: string | undefined,
  onConnected?: () => void
) {
  const centrifugeRef = useRef<Centrifuge | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // store 액션은 안정적 참조로 가져와서 useEffect 의존성에서 제외
  const setOrderStatusRef = useRef(useOrderStore.getState().setOrderStatus)
  const onConnectedRef = useRef(onConnected)
  onConnectedRef.current = onConnected

  useEffect(() => {
    if (!userId) return

    const wsUrl = process.env.NEXT_PUBLIC_CENTRIFUGO_URL
    if (!wsUrl) {
      console.warn("[useCentrifugoOrder] NEXT_PUBLIC_CENTRIFUGO_URL이 설정되지 않았습니다.")
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

    // 연결 상태 이벤트 핸들링
    centrifuge.on("connected", () => {
      setIsConnected(true)
      // 연결 완료 시 콜백 — 연결 전 유실된 이벤트를 보상하기 위해 최신 상태 재조회
      onConnectedRef.current?.()
    })

    centrifuge.on("disconnected", () => {
      setIsConnected(false)
    })

    // 서버 사이드 구독 채널(order#<userId>)의 publication 이벤트 수신
    centrifuge.on("publication", (ctx: { data: unknown }) => {
      const data = ctx.data as {
        type?: string
        orderId?: string
        status?: OrderStatus
      }

      if (data.type === "order:status_changed" && data.orderId && data.status) {
        setOrderStatusRef.current(data.orderId, data.status)
      }
    })

    centrifuge.connect()

    return () => {
      centrifuge.disconnect()
      centrifugeRef.current = null
      setIsConnected(false)
    }
  }, [userId])

  return { centrifugeRef, isConnected }
}
