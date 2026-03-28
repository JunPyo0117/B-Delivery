"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ShoppingCart, Search, Heart, ChevronDown } from "lucide-react"
import { useCartStore } from "@/stores/cart"
import { getReorderItems } from "@/app/(customer)/orders/actions"

/** 주문 내역 탭 타입 */
type TabType = "delivery" | "grocery"

/** 서버에서 넘겨받는 주문 데이터 타입 */
export interface OrderData {
  id: string
  status: string
  totalPrice: number
  createdAt: string
  restaurant: {
    name: string
    imageUrl: string | null
  }
  items: {
    id: string
    quantity: number
    price: number
    menu: { name: string; imageUrl?: string | null }
  }[]
  hasReview: boolean
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "주문 접수",
  COOKING: "조리중",
  WAITING_RIDER: "배달기사 찾는 중",
  RIDER_ASSIGNED: "배달기사 배정",
  PICKED_UP: "배달 중",
  DONE: "배달 완료",
  CANCELLED: "취소됨",
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

function formatPrice(price: number) {
  return price.toLocaleString()
}

interface OrderListPageProps {
  orders: OrderData[]
}

/**
 * 주문 내역 페이지 (FSD pages 레이어)
 * - 배달/픽업 | 장보기/쇼핑 탭
 * - 날짜별 그룹핑
 * - 같은 메뉴 담기 / 리뷰 작성 / 바로 주문 버튼
 * - 빈 상태: "주문 내역이 없어요"
 */
export function OrderListPage({ orders }: OrderListPageProps) {
  const [tab, setTab] = useState<TabType>("delivery")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { clearCart, addItem } = useCartStore()

  const handleReorder = async (orderId: string) => {
    startTransition(async () => {
      try {
        const { items, unavailable } = await getReorderItems(orderId)

        if (items.length === 0) {
          alert("주문 가능한 ��뉴가 없습니다.")
          return
        }

        clearCart()
        for (const item of items) {
          addItem(
            {
              menuId: item.menuId,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl,
              restaurantId: item.restaurantId,
              restaurantName: item.restaurantName,
            },
            item.quantity
          )
        }

        if (unavailable.length > 0) {
          alert(
            `품절된 메뉴가 제외되었습니다: ${unavailable.join(", ")}`
          )
        }

        router.push("/cart")
      } catch {
        alert("재주문에 실패했습���다. 다시 시도해���세요.")
      }
    })
  }

  // 날짜별로 그룹핑
  const groupedOrders = orders.reduce<Record<string, OrderData[]>>((acc, order) => {
    const dateKey = formatDate(order.createdAt)
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(order)
    return acc
  }, {})

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white">
        <div className="flex items-center justify-between h-12 px-4">
          <h1 className="text-[17px] font-bold text-gray-900">주문내역</h1>
          <Link href="/cart" className="p-1" aria-label="장바구니">
            <ShoppingCart className="size-5 text-gray-900" />
          </Link>
        </div>
      </header>

      {/* 탭 바 */}
      <div className="sticky top-12 z-30 bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setTab("delivery")}
            className={`flex-1 py-3 text-[13px] font-semibold text-center relative transition-colors ${
              tab === "delivery" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            배달/픽업
            {tab === "delivery" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
            )}
          </button>
          <button
            onClick={() => setTab("grocery")}
            className={`flex-1 py-3 text-[13px] font-semibold text-center relative transition-colors ${
              tab === "grocery" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            장보기/쇼핑
            {tab === "grocery" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
            )}
          </button>
        </div>
      </div>

      {/* 검색바 */}
      <div className="bg-white px-4 py-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2.5">
          <Search className="size-4 text-gray-400 shrink-0" />
          <span className="text-[13px] text-gray-400">
            주문한 메뉴나 가게를 찾아볼 수 있어요
          </span>
        </div>
      </div>

      {/* 필터 칩 */}
      <div className="bg-white px-4 pb-3 flex gap-2">
        {["주소", "조회기간", "주문 상태/정보"].map((label) => (
          <button
            key={label}
            className="flex items-center gap-0.5 rounded-full border border-gray-300 px-3 py-1.5 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {label}
            <ChevronDown className="size-3 text-gray-400" />
          </button>
        ))}
      </div>

      {/* 주문 목록 */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <ShoppingCart className="size-12 text-gray-200 mb-3" />
          <p className="text-[14px] font-medium text-gray-500">주문 내역이 없���요</p>
          <Link
            href="/"
            className="mt-3 text-[13px] text-[#2DB400] font-semibold hover:underline"
          >
            맛있는 음식 주문하러 가기
          </Link>
        </div>
      ) : (
        <div className="flex-1">
          {Object.entries(groupedOrders).map(([date, dateOrders]) => (
            <div key={date}>
              {/* 날짜 헤더 */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <p className="text-[12px] font-semibold text-gray-500">{date}</p>
              </div>

              {dateOrders.map((order) => {
                const isDone = order.status === "DONE"
                const isCancelled = order.status === "CANCELLED"
                const isActive = !isDone && !isCancelled
                const firstItemImage = order.items[0]?.menu?.imageUrl

                return (
                  <div key={order.id} className="bg-white mx-0 mb-2">
                    {/* 가게 정보 + 주문상세 링�� */}
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                      <div className="flex items-center gap-2">
                        {/* 가게 이미지 */}
                        <div className="relative size-7 rounded-full overflow-hidden bg-gray-100 shrink-0">
                          {order.restaurant.imageUrl ? (
                            <Image
                              src={order.restaurant.imageUrl}
                              alt={order.restaurant.name}
                              fill
                              className="object-cover"
                              sizes="28px"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center text-gray-300 text-[8px]">
                              🏪
                            </div>
                          )}
                        </div>
                        <span className="text-[14px] font-bold text-gray-900">
                          {order.restaurant.name}
                        </span>
                        {/* 상태 뱃지 (진행중일 때만) */}
                        {isActive && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#2DB400]/10 text-[#2DB400]">
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1" aria-label="찜하기">
                          <Heart className="size-4 text-gray-300" />
                        </button>
                      </div>
                    </div>

                    {/* 주문 상세 링크 */}
                    <Link
                      href={`/orders/${order.id}`}
                      className="block px-4 pb-3"
                    >
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                        <span>주문상세</span>
                      </div>

                      {/* 메뉴 썸네일 + 아이템 목록 */}
                      <div className="flex gap-3">
                        {/* 아이템 썸네일 */}
                        <div className="relative size-[60px] shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {firstItemImage ? (
                            <Image
                              src={firstItemImage}
                              alt="메뉴"
                              fill
                              className="object-cover"
                              sizes="60px"
                            />
                          ) : order.restaurant.imageUrl ? (
                            <Image
                              src={order.restaurant.imageUrl}
                              alt="메뉴"
                              fill
                              className="object-cover"
                              sizes="60px"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center text-gray-300 text-[10px]">
                              🍽
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {order.items.map((item) => (
                            <p
                              key={item.id}
                              className="text-[12px] text-gray-500 leading-relaxed truncate"
                            >
                              · {item.menu.name} {item.quantity}개
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* 가격 */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[11px] text-gray-900 font-medium">결제금액</span>
                        <span className="text-[14px] font-bold text-gray-900">
                          {formatPrice(order.totalPrice)}원
                        </span>
                      </div>
                    </Link>

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        onClick={() => handleReorder(order.id)}
                        disabled={isPending}
                        className="flex-1 h-10 rounded-lg border border-gray-300 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        같은 메뉴 담기
                      </button>
                      {isDone && !order.hasReview ? (
                        <Link
                          href={`/orders/${order.id}/review`}
                          className="flex-1 h-10 rounded-lg text-[13px] font-bold flex items-center justify-center text-white transition-colors"
                          style={{ backgroundColor: "#2DB400" }}
                        >
                          리뷰 작성
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleReorder(order.id)}
                          disabled={isPending}
                          className="flex-1 h-10 rounded-lg text-[13px] font-bold flex items-center justify-center text-white transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "#2DB400" }}
                        >
                          바로 주문
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
