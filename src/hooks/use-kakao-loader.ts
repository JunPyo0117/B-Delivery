"use client"

import { useEffect, useState } from "react"

interface KakaoLoaderState {
  isLoaded: boolean
  error: Error | null
}

const KAKAO_SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`
const POSTCODE_URL = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`스크립트 로딩 실패: ${src}`))
    document.head.appendChild(script)
  })
}

/** Kakao Map SDK + Postcode 스크립트를 로드하고 초기화 상태를 반환 */
export function useKakaoLoader(): KakaoLoaderState {
  const [state, setState] = useState<KakaoLoaderState>({
    isLoaded: false,
    error: null,
  })

  useEffect(() => {
    // 이미 로드 완료된 경우
    if (typeof kakao !== "undefined" && kakao.maps?.services) {
      setState({ isLoaded: true, error: null })
      return
    }

    let cancelled = false

    async function init() {
      try {
        // Kakao SDK 로드 + Postcode 병렬 로드
        await Promise.all([loadScript(KAKAO_SDK_URL), loadScript(POSTCODE_URL)])

        // Kakao SDK 초기화 (autoload=false이므로 수동 호출)
        await new Promise<void>((resolve) => {
          kakao.maps.load(resolve)
        })

        if (!cancelled) {
          setState({ isLoaded: true, error: null })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            isLoaded: false,
            error: err instanceof Error ? err : new Error("Kakao SDK 초기화 실패"),
          })
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
