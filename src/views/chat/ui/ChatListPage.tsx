"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImagePlus, ArrowUp } from "lucide-react"
import type { ChatOrderItem } from "@/types/chat"
import { createChat } from "@/features/chat/api/createChat"

interface ChatListPageProps {
  orderItems: ChatOrderItem[]
}

/**
 * 채팅 목록 페이지 (FSD pages 레이어)
 * - 주문 선택 -> 채팅 생성 -> 채팅방 이동
 * - "주문 말고 다른 문의" -> 일반 문의 채팅 생성
 * - 비즈니스 시간 안내 배너
 */
export function ChatListPage({ orderItems }: ChatListPageProps) {
  const router = useRouter()
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null)
  const [creatingGeneral, setCreatingGeneral] = useState(false)

  const handleOrderClick = async (order: ChatOrderItem) => {
    if (loadingOrderId) return
    setLoadingOrderId(order.orderId)

    try {
      // 이미 채팅방이 있으면 바로 이동
      if (order.chatId) {
        router.push(`/chat/${order.chatId}`)
        return
      }

      // 채팅방 생성
      const result = await createChat({ orderId: order.orderId })
      if (result.success && result.chatId) {
        router.push(`/chat/${result.chatId}`)
      }
    } catch {
      setLoadingOrderId(null)
    }
  }

  const handleGeneralInquiry = async () => {
    if (creatingGeneral) return
    setCreatingGeneral(true)

    try {
      const result = await createChat({ category: "기타문의" })
      if (result.success && result.chatId) {
        router.push(`/chat/${result.chatId}`)
      }
    } catch {
      setCreatingGeneral(false)
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-white border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 mr-3 rounded-full active:bg-gray-100 transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="size-5 text-gray-800" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">실시간 채팅 상담</h1>
      </header>

      {/* 카테고리 칩 */}
      <div className="flex gap-2 px-4 mt-4">
        <span className="px-4 py-1.5 text-[13px] font-bold rounded-full bg-[#2DB400] text-white">
          배민
        </span>
        <span className="px-4 py-1.5 text-[13px] font-medium rounded-full border border-gray-300 text-gray-500">
          기타문의
        </span>
      </div>

      {/* 비즈니스 시간 안내 */}
      <BusinessHoursBanner />

      {/* 시스템 안내 메시지 */}
      <div className="px-4 mt-5">
        <p className="text-[14px] text-gray-600 mb-3">
          문의하고 싶은 주문을 선택해주세요.
        </p>

        {/* 주문 카드 목록 */}
        <div className="space-y-2.5">
          {orderItems.map((order) => (
            <ChatOrderCard
              key={order.orderId}
              order={order}
              loading={loadingOrderId === order.orderId}
              onClick={() => handleOrderClick(order)}
            />
          ))}
        </div>

        {orderItems.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-[14px] text-gray-400">
              주문 내역이 없습니다.
            </p>
          </div>
        )}
      </div>

      {/* 하단 링크 */}
      <div className="px-4 mt-6 mb-4 space-y-2.5 text-center">
        <button className="block w-full text-[14px] text-[#2DB400] font-medium hover:underline transition-colors">
          제가 찾는 주문이 없어요
        </button>
        <button
          onClick={handleGeneralInquiry}
          disabled={creatingGeneral}
          className="block w-full text-[14px] text-[#2DB400] font-medium hover:underline transition-colors disabled:opacity-50"
        >
          {creatingGeneral ? "채팅방 생성 중..." : "주문 말고 다른 문의가 있어요"}
        </button>
      </div>

      {/* 하단 입력 바 (비활성) */}
      <div className="mt-auto sticky bottom-0 bg-white border-t border-gray-100 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <button
            disabled
            className="p-2 text-gray-300"
            aria-label="이미지 전송"
          >
            <ImagePlus className="size-5" />
          </button>
          <div className="flex-1 h-10 rounded-full bg-[#F5F5F5] flex items-center px-4">
            <span className="text-[14px] text-gray-400">
              현재는 텍스트 입력이 불가합니다.
            </span>
          </div>
          <button
            disabled
            className="size-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0"
            aria-label="전송"
          >
            <ArrowUp className="size-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** 비즈니스 시간 안내 배너 */
function BusinessHoursBanner() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="mx-4 mt-3">
      <div className="rounded-xl bg-[#F5F5F5] px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 text-[13px] leading-5 text-gray-600">
            <p className="font-medium text-gray-700">배민 상담사 업무시간: 24시</p>
            {isOpen && (
              <p className="mt-0.5 text-gray-500">
                B마트 상담사 업무시간: 09:00 ~ 익일 01:00
              </p>
            )}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-3 shrink-0 text-[13px] text-gray-500 underline underline-offset-2 hover:text-gray-700 transition-colors"
          >
            {isOpen ? "접기" : "펼치기"}
          </button>
        </div>
      </div>

      {isOpen && (
        <p className="mt-2 px-1 text-[11px] leading-4 text-gray-400">
          본인이 아닌 경우 상담이 제한될 수 있으며, 상담을 위하여 대화 내용은 저장됩니다.
        </p>
      )}
    </div>
  )
}

/** 채팅 주문 카드 */
function ChatOrderCard({
  order,
  loading,
  onClick,
}: {
  order: ChatOrderItem
  loading: boolean
  onClick: () => void
}) {
  const date = new Date(order.createdAt)
  const dateStr = `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, "0")}월 ${String(date.getDate()).padStart(2, "0")}일 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-[#F5F5F5] text-left
        hover:bg-[#EEEEEE] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
    >
      {/* 가게 썸네일 */}
      <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-black/5">
        {order.restaurantImageUrl ? (
          <img
            src={order.restaurantImageUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <span className="text-lg">🍗</span>
        )}
      </div>

      {/* 주문 정보 */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[14px] text-gray-900 truncate">
          {order.restaurantName}
        </p>
        <p className="text-[12px] text-gray-500 mt-0.5 truncate">
          {order.itemSummary} {order.totalPrice.toLocaleString()}원
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">{dateStr}</p>
      </div>

      {/* 로딩 인디케이터 */}
      {loading && (
        <div className="size-4 border-2 border-gray-300 border-t-[#2DB400] rounded-full animate-spin shrink-0" />
      )}
    </button>
  )
}
