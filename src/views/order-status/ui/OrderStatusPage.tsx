"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, MapPin, MessageCircle } from "lucide-react"
import Link from "next/link"

import {
  OrderProgressBar,
  CancelOrderButton,
  useCentrifugoOrder,
  useCentrifugoRiderLocation,
  useOrderStore,
} from "@/features/order"
import { getOrderDetail } from "@/entities/order/api/getOrderDetail"
import {
  ORDER_STATUS_LABELS,
  DELIVERING_STATUSES,
  isStatusAhead,
  type OrderDetailData,
} from "@/entities/order"
import { KakaoMap } from "@/shared/ui/kakao-map"
import { formatPrice } from "@/shared/lib"
import type { OrderStatus } from "@/generated/prisma/client"

interface OrderStatusPageProps {
  orderId: string
}

export function OrderStatusPage({ orderId }: OrderStatusPageProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = session?.user?.id

  // 주문 데이터 로딩
  const [order, setOrder] = useState<OrderDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)
      try {
        const data = await getOrderDetail(orderId, userId!)
        if (!data) {
          setError("주문을 찾을 수 없습니다.")
        } else {
          // forward-only: WebSocket으로 이미 더 최신 상태를 받았으면 덮어쓰지 않음
          const current = useOrderStore.getState().orders[orderId]
          if (!current || isStatusAhead(data.status, current.status)) {
            setOrder(data)
            useOrderStore.getState().setOrderStatus(orderId, data.status)
          } else {
            // 주문 상세 정보(메뉴, 가격 등)는 갱신하되 상태는 유지
            setOrder(data)
          }
        }
      } catch {
        setError("주문 정보를 불러오는 데 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [orderId, userId])

  // Centrifugo 실시간 주문 상태 구독
  // 연결 완료 시 재조회 — forward-only로 stale 데이터가 WebSocket 이벤트를 덮어쓰지 않음
  const { centrifugeRef } = useCentrifugoOrder(userId, () => {
    if (!userId) return
    getOrderDetail(orderId, userId).then((data) => {
      if (!data) return
      const current = useOrderStore.getState().orders[orderId]
      if (!current || isStatusAhead(data.status, current.status)) {
        setOrder(data)
        useOrderStore.getState().setOrderStatus(orderId, data.status)
      }
    })
  })

  // orderStore에서 실시간 상태 구독
  const realtimeEntry = useOrderStore((s) => s.orders[orderId])
  const currentStatus: OrderStatus =
    realtimeEntry?.status ?? order?.status ?? "PENDING"

  // PICKED_UP 상태일 때 기사 위치 구독
  const isDelivering = currentStatus === "PICKED_UP"
  useCentrifugoRiderLocation(
    centrifugeRef,
    isDelivering ? orderId : undefined
  )
  const riderLocation = useOrderStore((s) => s.riderLocation)

  // 주문 취소 콜백
  const handleCancelled = () => {
    useOrderStore.getState().setOrderStatus(orderId, "CANCELLED")
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-white">
        <StatusHeader orderId={orderId} />
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-dvh flex-col bg-white">
        <StatusHeader orderId={orderId} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
          <p className="text-[15px] font-medium text-gray-900">
            {error ?? "주문을 찾을 수 없습니다."}
          </p>
          <button
            onClick={() => router.push("/orders")}
            className="text-[13px] font-semibold"
            style={{ color: "#2DB400" }}
          >
            주문 내역으로 이동
          </button>
        </div>
      </div>
    )
  }

  // 지도 마커 구성
  const mapMarkers: { lat: number; lng: number; label?: string }[] = [
    {
      lat: order.restaurantLat,
      lng: order.restaurantLng,
      label: order.restaurantName,
    },
  ]

  if (isDelivering && riderLocation) {
    mapMarkers.push({
      lat: riderLocation.lat,
      lng: riderLocation.lng,
      label: "배달 기사",
    })
  }

  const mapCenter = isDelivering && riderLocation
    ? { lat: riderLocation.lat, lng: riderLocation.lng }
    : { lat: order.restaurantLat, lng: order.restaurantLng }

  const isCancelled = currentStatus === "CANCELLED"
  const isDone = currentStatus === "DONE"

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <StatusHeader orderId={orderId} />

      <div className="flex-1 pb-6">
        {/* 카카오 지도 */}
        <div className="relative">
          <KakaoMap
            lat={mapCenter.lat}
            lng={mapCenter.lng}
            level={4}
            markers={mapMarkers}
            className="h-52"
            draggable={false}
          />

          {/* 배달 중 도착 예정 표시 */}
          {isDelivering && riderLocation && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2 shadow-md">
              <span className="text-[13px] font-semibold text-gray-900">
                배달 중, 도착 예정{" "}
                <span style={{ color: "#2DB400" }}>
                  {riderLocation.estimatedMinutes}분
                </span>
              </span>
            </div>
          )}
        </div>

        {/* 주문 상태 프로그레스 바 */}
        <div className="bg-white px-4 py-6">
          <OrderProgressBar currentStatus={currentStatus} />

          {/* 상태 텍스트 */}
          <p className="mt-4 text-center text-[16px] font-bold text-gray-900">
            {ORDER_STATUS_LABELS[currentStatus]}
          </p>
        </div>

        {/* 구분선 */}
        <div className="h-2 bg-gray-50" />

        {/* 주문 상세 정보 */}
        <div className="bg-white px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-gray-900">
              {order.restaurantName}
            </h3>
            <Link
              href={`/chat?restaurantId=${order.restaurantId}`}
              className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-gray-50"
              style={{ borderColor: "#2DB400", color: "#2DB400" }}
            >
              <MessageCircle className="size-3.5" />
              채팅 문의
            </Link>
          </div>

          {/* 메뉴 목록 */}
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between"
              >
                <span className="text-[13px] text-gray-700">
                  {item.menuName}
                  <span className="ml-1 text-gray-400">
                    {item.quantity}개
                  </span>
                </span>
                <span className="text-[13px] font-medium text-gray-700">
                  {formatPrice(
                    (item.price + item.optionPrice) * item.quantity
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* 결제 금액 */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-[14px] font-bold text-gray-900">
              총 결제금액
            </span>
            <span
              className="text-[15px] font-extrabold"
              style={{ color: "#2DB400" }}
            >
              {formatPrice(order.totalPrice)}
            </span>
          </div>
        </div>

        {/* 배달 주소 */}
        <div className="mt-2 bg-white px-4 py-4">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" />
            <div>
              <h3 className="mb-1 text-[13px] font-bold text-gray-900">
                배달 주소
              </h3>
              <p className="text-[12px] leading-relaxed text-gray-500">
                {order.deliveryAddress}
              </p>
              {order.deliveryNote && (
                <p className="mt-1 text-[11px] text-gray-400">
                  요청사항: {order.deliveryNote}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 배달 기사 정보 (배정 이후) */}
        {order.delivery && (
          <div className="mt-2 bg-white px-4 py-4">
            <h3 className="mb-2 text-[14px] font-bold text-gray-900">
              배달 기사 정보
            </h3>
            <div className="space-y-1 text-[13px] text-gray-600">
              {order.delivery.riderNickname && (
                <p>기사: {order.delivery.riderNickname}</p>
              )}
              {order.delivery.riderTransport && (
                <p>이동수단: {order.delivery.riderTransport}</p>
              )}
              {order.delivery.estimatedTime && (
                <p>예상 배달시간: {order.delivery.estimatedTime}분</p>
              )}
            </div>
          </div>
        )}

        {/* 주문 취소 버튼 */}
        {userId && !isCancelled && !isDone && (
          <div className="mt-4 px-4">
            <CancelOrderButton
              orderId={orderId}
              userId={userId}
              currentStatus={currentStatus}
              onCancelled={handleCancelled}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}

/** 상태 페이지 헤더 */
function StatusHeader({ orderId }: { orderId: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-12 items-center px-4">
        <Link
          href={`/orders/${orderId}`}
          className="mr-3 p-1"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="size-5 text-gray-900" />
        </Link>
        <h1 className="text-[16px] font-bold text-gray-900">주문 상태</h1>
      </div>
    </header>
  )
}
