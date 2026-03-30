"use client"

import { MapPin } from "lucide-react"
import { useState } from "react"

import { Button } from "@/shared/ui/button"
import { useKakaoLoader } from "@/shared/lib/use-kakao-loader"
import { openPostcodePopup, type PostcodeResult } from "@/shared/lib/kakao"

interface AddressSearchProps {
  onSelect: (result: PostcodeResult) => void
  children?: React.ReactNode
}

/** 카카오 우편번호 팝업을 트리거하는 주소 검색 컴포넌트 */
export function AddressSearch({ onSelect, children }: AddressSearchProps) {
  const { isLoaded, isPostcodeReady } = useKakaoLoader()
  const [isSearching, setIsSearching] = useState(false)

  // Postcode 팝업은 Kakao Map SDK 없이도 동작 가능
  const canSearch = isPostcodeReady

  async function handleClick() {
    if (!canSearch || isSearching) return

    setIsSearching(true)
    try {
      const result = await openPostcodePopup()
      onSelect(result)
    } catch (err) {
      console.error("[AddressSearch] 주소 검색 실패:", err)
    } finally {
      setIsSearching(false)
    }
  }

  if (children) {
    return (
      <button type="button" onClick={handleClick} disabled={!canSearch || isSearching}>
        {children}
      </button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={!canSearch || isSearching}
    >
      <MapPin data-icon="inline-start" className="size-4" />
      {!isPostcodeReady ? "로딩 중..." : isSearching ? "검색 중..." : "주소 검색"}
    </Button>
  )
}
