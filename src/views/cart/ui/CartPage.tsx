"use client"

import { useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Store, ChevronRight, Plus, ShoppingBag } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Textarea } from "@/shared/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import {
  useCartStore,
  CartItemCard,
  CartSummary,
} from "@/features/cart"
import { placeOrder } from "@/features/cart/api/placeOrder"
import { formatPrice } from "@/shared/lib"

export function CartPage() {
  const router = useRouter()
  const {
    items,
    restaurantId,
    restaurantName,
    deliveryFee,
    minOrderAmount,
    updateQuantity,
    removeItem,
    clearCart,
    getTotal,
    getTotalQuantity,
  } = useCartStore()

  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
  const [deliveryNote, setDeliveryNote] = useState("")
  const [isOrdering, setIsOrdering] = useState(false)
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean
    title: string
    message: string
  }>({ open: false, title: "", message: "" })

  const itemTotal = mounted ? getTotal() : 0
  const subtotal = itemTotal
  const total = itemTotal + deliveryFee
  const count = mounted ? getTotalQuantity() : 0
  const meetsMin = mounted ? itemTotal >= minOrderAmount : true
  const isEmpty = !mounted || items.length === 0

  /** 주문하기 핸들러 */
  const handlePlaceOrder = async () => {
    if (!restaurantId || items.length === 0 || isOrdering) return
    setIsOrdering(true)

    try {
      // 배달 주소 확인
      const res = await fetch("/api/user/address")
      const data = await res.json()

      if (!data.address) {
        setErrorDialog({
          open: true,
          title: "배달 주소 미설정",
          message:
            "배달 주소를 설정해 주세요.\n마이페이지에서 주소를 등록할 수 있습니다.",
        })
        setIsOrdering(false)
        return
      }

      const result = await placeOrder({
        restaurantId,
        deliveryAddress: data.address,
        deliveryLat: data.latitude ?? 37.5665,
        deliveryLng: data.longitude ?? 126.978,
        deliveryNote: deliveryNote.trim() || undefined,
        items: items.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
          price: item.price,
          optionPrice: item.options.reduce((acc, o) => acc + o.extraPrice, 0),
          selectedOptions: item.options.map((opt) => ({
            groupName: opt.groupName,
            optionName: opt.optionName,
            extraPrice: opt.extraPrice,
          })),
        })),
      })

      if (!result.success) {
        setErrorDialog({
          open: true,
          title: "주문 실패",
          message: result.error ?? "주문 처리 중 오류가 발생했습니다.",
        })
        setIsOrdering(false)
      } else {
        clearCart()
        router.push(`/orders/${result.orderId}/status`)
      }
    } catch {
      setErrorDialog({
        open: true,
        title: "주문 실패",
        message: "네트워크 오류가 발생했습니다. 다시 시도해 주세요.",
      })
      setIsOrdering(false)
    }
  }

  // 빈 장바구니 화면
  if (!mounted) {
    return (
      <div className="flex min-h-dvh flex-col bg-white">
        <Header onBack={() => router.back()} />
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex min-h-dvh flex-col bg-white">
        <Header onBack={() => router.back()} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <div className="flex size-20 items-center justify-center rounded-full bg-gray-100">
            <ShoppingBag className="size-10 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-gray-900">
              장바구니가 비어있어요
            </p>
            <p className="mt-1 text-[13px] text-gray-400">
              메뉴를 담아보세요
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-2 rounded-full px-6"
            onClick={() => router.push("/")}
          >
            가게 둘러보기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <Header onBack={() => router.back()} />

      {/* 컨텐츠 */}
      <div className="flex-1 pb-40">
        {/* 가게 정보 */}
        <div className="bg-white">
          <button
            type="button"
            onClick={() => router.push(`/restaurants/${restaurantId}`)}
            className="flex w-full items-center gap-2.5 px-4 py-3.5 transition-colors hover:bg-gray-50"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-gray-100">
              <Store className="size-4 text-gray-500" />
            </div>
            <span className="flex-1 text-left text-[14px] font-bold text-gray-900">
              {restaurantName}
            </span>
            <ChevronRight className="size-4 text-gray-400" />
          </button>
        </div>

        {/* 장바구니 아이템 목록 */}
        <div className="border-t border-gray-100 bg-white">
          <div className="divide-y divide-gray-100 px-4">
            {items.map((item) => (
              <CartItemCard
                key={item.cartItemKey}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </div>
        </div>

        {/* + 메뉴 추가 버튼 */}
        <div className="border-t border-gray-100 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => router.push(`/restaurants/${restaurantId}`)}
            className="flex items-center gap-0.5 text-[13px] font-semibold"
            style={{ color: "#2DB400" }}
          >
            <Plus className="size-3.5" />
            메뉴 추가
          </button>
        </div>

        {/* 결제 금액 요약 */}
        <div className="mt-2 bg-white px-4 py-4">
          <h3 className="mb-3 text-[14px] font-bold text-gray-900">
            결제금액
          </h3>
          <CartSummary
            totalItemPrice={subtotal}
            deliveryFee={deliveryFee}
            totalPrice={total}
            minOrderAmount={minOrderAmount}
            meetsMinOrder={meetsMin}
          />
        </div>

        {/* 배달 요청사항 */}
        <div className="mt-2 bg-white px-4 py-4">
          <h3 className="mb-2 text-[14px] font-bold text-gray-900">
            배달 요청사항
          </h3>
          <Textarea
            placeholder="예: 문 앞에 놔주세요, 벨 눌러주세요"
            value={deliveryNote}
            onChange={(e) => setDeliveryNote(e.target.value)}
            rows={2}
            className="resize-none text-[13px]"
          />
        </div>
      </div>

      {/* 하단 고정: 주문하기 버튼 */}
      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-gray-200 bg-white">
        <div className="px-4 py-3">
          {/* 총 결제 금액 */}
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[20px] font-extrabold text-gray-900">
              {formatPrice(total)}
            </span>
            <span className="text-[12px] text-gray-400">
              ({count}개)
            </span>
          </div>

          {/* CTA 버튼 */}
          <Button
            className="h-12 w-full rounded-lg text-[15px] font-bold text-white"
            style={{ backgroundColor: "#2DB400" }}
            disabled={!meetsMin || isOrdering}
            onClick={handlePlaceOrder}
          >
            {isOrdering
              ? "주문 처리 중..."
              : !meetsMin
                ? `최소 주문금액: ${formatPrice(minOrderAmount)}`
                : `주문하기 ${formatPrice(total)}`}
          </Button>
        </div>
      </div>

      {/* 에러 다이얼로그 */}
      <Dialog
        open={errorDialog.open}
        onOpenChange={(open) =>
          setErrorDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{errorDialog.title}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() =>
                setErrorDialog((prev) => ({ ...prev, open: false }))
              }
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** 공통 헤더 */
function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center bg-white px-4">
      <button
        type="button"
        onClick={onBack}
        className="p-1"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="size-5 text-gray-900" />
      </button>
      <h1 className="ml-3 text-[16px] font-bold text-gray-900">장바구니</h1>
    </header>
  )
}
