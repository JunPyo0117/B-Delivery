"use client"

import { useEffect, useRef } from "react"
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
export function useCentrifugoOrder(userId: string | undefined) {
  const centrifugeRef = useRef<Centrifuge | null>(null)
  const setOrderStatus = useOrderStore((s) => s.setOrderStatus)

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

    // 서버 사이드 구독 채널(order#<userId>)의 publication 이벤트 수신
    centrifuge.on("publication", (ctx: { data: unknown }) => {
      const data = ctx.data as {
        type?: string
        orderId?: string
        status?: OrderStatus
      }

      if (data.type === "order:status_changed" && data.orderId && data.status) {
        setOrderStatus(data.orderId, data.status)
      }
    })

    centrifuge.connect()

    return () => {
      centrifuge.disconnect()
      centrifugeRef.current = null
    }
  }, [userId, setOrderStatus])

  return centrifugeRef
}
