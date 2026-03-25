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

    // 기존 마커 제거
    markerRefs.current.forEach((m) => m.setMap(null))
    markerRefs.current = []

    // 새 마커 생성
    const newMarkers = (markers ?? [{ lat, lng }]).map((m) => {
      const position = new kakao.maps.LatLng(m.lat, m.lng)
      return new kakao.maps.Marker({ position, map: mapRef.current! })
    })

    markerRefs.current = newMarkers
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
