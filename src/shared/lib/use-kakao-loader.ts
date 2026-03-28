"use client"

import { useEffect, useState } from "react"

interface KakaoLoaderState {
  isLoaded: boolean
  isPostcodeReady: boolean
  error: Error | null
}

const KAKAO_SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`
const POSTCODE_URL = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 프로토콜 상대 URL을 브라우저가 절대 URL로 변환할 수 있으므로 유연하게 검색
    const normalizedSrc = src.replace(/^\/\//, "")
    const existing = document.querySelector(
      `script[src*="${normalizedSrc}"]`
    ) as HTMLScriptElement | null

    if (existing) {
      // 이미 로드 완료된 경우
      if (existing.dataset.loaded === "true") {
        resolve()
        return
      }
      // 아직 로딩 중인 경우 이벤트 대기
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error(`스크립트 로딩 실패: ${src}`)), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = "true"
      resolve()
    }
    script.onerror = () => reject(new Error(`스크립트 로딩 실패: ${src}`))
    document.head.appendChild(script)
  })
}

/** Kakao Map SDK + Postcode 스크립트를 로드하고 초기화 상태를 반환 */
export function useKakaoLoader(): KakaoLoaderState {
  const [state, setState] = useState<KakaoLoaderState>({
    isLoaded: false,
    isPostcodeReady: false,
    error: null,
  })

  useEffect(() => {
    // 이미 모두 로드 완료된 경우
    if (
      typeof kakao !== "undefined" &&
      kakao.maps?.services &&
      typeof daum !== "undefined" &&
      daum.Postcode
    ) {
      setState({ isLoaded: true, isPostcodeReady: true, error: null })
      return
    }

    let cancelled = false

    async function init() {
      // 1) Postcode 스크립트 먼저 독립 로드 (API 키 불필요)
      try {
        await loadScript(POSTCODE_URL)
        if (!cancelled) {
          setState((prev) => ({ ...prev, isPostcodeReady: true }))
        }
      } catch (err) {
        console.error("[KakaoLoader] Postcode 스크립트 로딩 실패:", err)
      }

      // 2) Kakao Map SDK 로드 (API 키 필요, 실패해도 Postcode는 동작)
      try {
        await loadScript(KAKAO_SDK_URL)

        // Kakao SDK 초기화 (autoload=false이므로 수동 호출)
        await new Promise<void>((resolve, reject) => {
          if (typeof kakao === "undefined" || !kakao.maps) {
            reject(new Error("Kakao SDK가 정의되지 않음"))
            return
          }
          kakao.maps.load(resolve)
        })

        if (!cancelled) {
          setState((prev) => ({ ...prev, isLoaded: true, error: null }))
        }
      } catch (err) {
        console.error("[KakaoLoader] Kakao Map SDK 로딩 실패:", err)
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            error:
              err instanceof Error
                ? err
                : new Error("Kakao SDK 초기화 실패"),
          }))
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
