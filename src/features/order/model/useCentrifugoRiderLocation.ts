"use client"

import { useEffect, useRef } from "react"
import { Centrifuge, Subscription } from "centrifuge"
import { useOrderStore } from "./orderStore"

/**
 * Centrifugo 기사 위치 실시간 구독 훅
 * - `rider_location:<orderId>` 채널 구독
 * - 위치 수신 → orderStore.setRiderLocation() 반영
 * - orderId 변경 시 이전 구독 해제 + 새 구독
 */
export function useCentrifugoRiderLocation(
  centrifugeRef: React.RefObject<Centrifuge | null>,
  orderId: string | undefined
) {
  const subRef = useRef<Subscription | null>(null)
  const setRiderLocation = useOrderStore((s) => s.setRiderLocation)

  useEffect(() => {
    const centrifuge = centrifugeRef.current
    if (!centrifuge || !orderId) {
      // 이전 구독이 있으면 해제
      if (subRef.current) {
        subRef.current.unsubscribe()
        centrifuge?.removeSubscription(subRef.current)
        subRef.current = null
      }
      setRiderLocation(null)
      return
    }

    const channel = `rider_location:${orderId}`

    // 이미 같은 채널을 구독 중이면 스킵
    const existingSub = centrifuge.getSubscription(channel)
    if (existingSub) {
      subRef.current = existingSub
      return
    }

    // 이전 구독 해제
    if (subRef.current) {
      subRef.current.unsubscribe()
      centrifuge.removeSubscription(subRef.current)
      subRef.current = null
    }

    const sub = centrifuge.newSubscription(channel)

    sub.on("publication", (ctx) => {
      const data = ctx.data as {
        lat: number
        lng: number
        estimatedMinutes: number
      }
      setRiderLocation({
        lat: data.lat,
        lng: data.lng,
        estimatedMinutes: data.estimatedMinutes,
      })
    })

    sub.on("unsubscribed", () => {
      setRiderLocation(null)
    })

    sub.subscribe()
    subRef.current = sub

    return () => {
      sub.unsubscribe()
      centrifuge.removeSubscription(sub)
      subRef.current = null
      setRiderLocation(null)
    }
  }, [centrifugeRef, orderId, setRiderLocation])
}
