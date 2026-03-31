"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/shared/lib/utils"
import { useKakaoLoader } from "@/shared/lib/use-kakao-loader"

interface MarkerInfo {
  lat: number
  lng: number
  label?: string
}

interface KakaoMapProps {
  lat: number
  lng: number
  level?: number
  markers?: MarkerInfo[]
  className?: string
  draggable?: boolean
}

/** Kakao 지도 표시 + 마커 컴포넌트 */
export function KakaoMap({
  lat,
  lng,
  level = 3,
  markers,
  className,
  draggable = true,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const overlayRefs = useRef<kakao.maps.CustomOverlay[]>([])
  const { isLoaded } = useKakaoLoader()

  // 지도 초기화 + 마커 생성을 하나의 effect로 통합
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return

    const center = new kakao.maps.LatLng(lat, lng)

    // 지도가 없으면 생성, 있으면 중심/레벨 업데이트
    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(containerRef.current, { center, level })
    } else {
      mapRef.current.setCenter(center)
      mapRef.current.setLevel(level)
    }

    const map = mapRef.current

    // 기존 오버레이 제거
    overlayRefs.current.forEach((o) => o.setMap(null))
    overlayRefs.current = []

    // 마커(커스텀 오버레이) 생성
    const markerList = markers ?? [{ lat, lng }]

    markerList.forEach((m) => {
      const position = new kakao.maps.LatLng(m.lat, m.lng)

      const content = document.createElement("div")
      content.style.cssText = "display:flex;flex-direction:column;align-items:center;"

      if (m.label) {
        const labelEl = document.createElement("span")
        labelEl.style.cssText = "background:#fff;border:1px solid #ddd;border-radius:4px;padding:2px 6px;font-size:11px;font-weight:600;color:#333;white-space:nowrap;margin-bottom:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);"
        labelEl.textContent = m.label
        content.appendChild(labelEl)
      }

      const svgHtml = `<svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#FF3B30"/>
          <circle cx="14" cy="14" r="6" fill="#fff"/>
        </svg>`
      content.insertAdjacentHTML("beforeend", svgHtml)

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content,
        map,
        yAnchor: 1,
      })

      overlayRefs.current.push(overlay)
    })
  }, [isLoaded, lat, lng, level, markers, draggable])

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground text-sm",
          className
        )}
      >
        지도 로딩 중...
      </div>
    )
  }

  return <div ref={containerRef} className={cn("w-full h-48", className)} />
}
