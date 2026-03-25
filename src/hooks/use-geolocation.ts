"use client"

import { useCallback, useState } from "react"

type GeolocationStatus = "idle" | "loading" | "granted" | "denied" | "error"

interface GeolocationState {
  status: GeolocationStatus
  position: { lat: number; lng: number } | null
  error: string | null
}

/** 브라우저 Geolocation API를 사용한 현재 위치 감지 훅 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    status: "idle",
    position: null,
    error: null,
  })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        status: "error",
        position: null,
        error: "이 브라우저에서는 위치 서비스를 지원하지 않습니다",
      })
      return
    }

    setState((prev) => ({ ...prev, status: "loading", error: null }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "granted",
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
        })
      },
      (err) => {
        const isDenied = err.code === GeolocationPositionError.PERMISSION_DENIED
        setState({
          status: isDenied ? "denied" : "error",
          position: null,
          error: isDenied
            ? "위치 권한이 거부되었습니다. 주소를 직접 입력해주세요."
            : "위치를 가져올 수 없습니다. 주소를 직접 입력해주세요.",
        })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return { ...state, requestLocation }
}
