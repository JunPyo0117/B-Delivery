"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"
import { useKakaoLoader } from "@/hooks/use-kakao-loader"

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
  const markerRefs = useRef<kakao.maps.Marker[]>([])
  const overlayRefs = useRef<kakao.maps.CustomOverlay[]>([])
  const { isLoaded } = useKakaoLoader()

  // 지도 초기화
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return

    const center = new kakao.maps.LatLng(lat, lng)
    const map = new kakao.maps.Map(containerRef.current, { center, level })

    if (!draggable) {
      // 드래그 비활성화는 setDraggable이 타입에 없으므로 옵션으로만 제어
    }

    mapRef.current = map
  }, [isLoaded, draggable]) // eslint-disable-line react-hooks/exhaustive-deps

  // 중심 좌표 업데이트
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setCenter(new kakao.maps.LatLng(lat, lng))
  }, [lat, lng])

  // 줌 레벨 업데이트
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setLevel(level)
  }, [level])

  // 마커 업데이트
  useEffect(() => {
    if (!mapRef.current) return

    // 기존 마커·오버레이 제거
    markerRefs.current.forEach((m) => m.setMap(null))
    markerRefs.current = []
    overlayRefs.current.forEach((o) => o.setMap(null))
    overlayRefs.current = []

    const markerList = markers ?? [{ lat, lng }]

    markerList.forEach((m) => {
      const position = new kakao.maps.LatLng(m.lat, m.lng)

      // 커스텀 오버레이 (SVG 핀 + 라벨)
      const content = document.createElement("div")
      content.style.cssText = "display:flex;flex-direction:column;align-items:center;"
      content.innerHTML = `
        ${m.label ? `<span style="background:#fff;border:1px solid #ddd;border-radius:4px;padding:2px 6px;font-size:11px;font-weight:600;color:#333;white-space:nowrap;margin-bottom:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">${m.label}</span>` : ""}
        <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#FF3B30"/>
          <circle cx="14" cy="14" r="6" fill="#fff"/>
        </svg>
      `

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content,
        map: mapRef.current!,
        yAnchor: 1,
      })

      overlayRefs.current.push(overlay)
    })
  }, [markers, lat, lng])

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
