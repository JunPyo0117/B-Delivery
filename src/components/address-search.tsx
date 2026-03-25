"use client"

import { MapPin } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useKakaoLoader } from "@/hooks/use-kakao-loader"
import { openPostcodePopup, type PostcodeResult } from "@/lib/kakao"

interface AddressSearchProps {
  onSelect: (result: PostcodeResult) => void
  children?: React.ReactNode
}

/** 카카오 우편번호 팝업을 트리거하는 주소 검색 컴포넌트 */
export function AddressSearch({ onSelect, children }: AddressSearchProps) {
  const { isLoaded } = useKakaoLoader()
  const [isSearching, setIsSearching] = useState(false)

  async function handleClick() {
    if (!isLoaded || isSearching) return

    setIsSearching(true)
    try {
      const result = await openPostcodePopup()
      onSelect(result)
    } catch {
      // 사용자가 팝업을 닫은 경우 무시
    } finally {
      setIsSearching(false)
    }
  }

  if (children) {
    return (
      <button type="button" onClick={handleClick} disabled={!isLoaded || isSearching}>
        {children}
      </button>
    )
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={!isLoaded || isSearching}
    >
      <MapPin data-icon="inline-start" className="size-4" />
      {isSearching ? "검색 중..." : "주소 검색"}
    </Button>
  )
}
