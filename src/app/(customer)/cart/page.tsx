"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart";
import { CartItemCard } from "./_components/cart-item-card";
import { OrderSummary } from "./_components/order-summary";
import { getRestaurantDeliveryInfo, createOrder } from "./actions";

export default function CartPage() {
  const router = useRouter();
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
    setDeliveryInfo,
  } = useCartStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 음식점 배달 정보 가져오기
  useEffect(() => {
    async function fetchDeliveryInfo() {
      if (restaurantId) {
        try {
          const info = await getRestaurantDeliveryInfo(restaurantId);
          setDeliveryInfo(info.deliveryFee, info.minOrderAmount);
        } catch {
          // 에러 시 기본값 유지
        }
      }
      setIsLoading(false);
    }
    fetchDeliveryInfo();
  }, [restaurantId, setDeliveryInfo]);

  const subtotal = getTotal();
  const isBelowMinimum = subtotal < minOrderAmount;
  const isEmpty = items.length === 0;

  /** 주문 확정 핸들러 */
  const handlePlaceOrder = () => {
    if (!restaurantId || items.length === 0) return;
    setError(null);

    startTransition(async () => {
      // 유저의 기본 주소를 세션에서 가져오기 위해 별도 API 없이
      // Server Action 내부에서 세션 확인 후 처리
      // 여기서는 defaultAddress를 직접 가져올 수 없으므로
      // 별도 fetch로 해결
      try {
        const res = await fetch("/api/user/address");
        const data = await res.json();

        if (!data.address) {
          setError("배달 주소를 설정해 주세요. 마이페이지에서 주소를 등록할 수 있습니다.");
          return;
        }

        const result = await createOrder({
          restaurantId,
          deliveryAddress: data.address,
          items: items.map((item) => ({
            menuId: item.menuId,
            quantity: item.quantity,
            price: item.price,
          })),
        });

        if ("error" in result) {
          setError(result.error);
        } else {
          // redirect는 server action에서 처리
          clearCart();
        }
      } catch {
        setError("주문 처리 중 오류가 발생했습니다.");
      }
    });
  };

  // 빈 장바구니 화면
  if (!isLoading && isEmpty) {
    return (
      <div className="flex min-h-dvh flex-col">
        {/* 헤더 */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-base font-semibold">장바구니</h1>
          <div className="w-6" />
        </header>

        {/* 빈 상태 */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <ShoppingCart className="size-16 text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-lg font-semibold">담은 메뉴가 없어요</p>
            <p className="mt-1 text-sm text-muted-foreground">
              맛있는 메뉴를 담아보세요
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="mt-2"
          >
            가게 둘러보기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-base font-semibold">장바구니</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          전체삭제
        </button>
      </header>

      {/* 컨텐츠 */}
      <div className="flex-1 pb-32">
        {/* 음식점 이름 */}
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={() => router.push(`/restaurants/${restaurantId}`)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {restaurantName}
          </button>
        </div>

        <Separator />

        {/* 장바구니 아이템 목록 */}
        <div className="px-4">
          {items.map((item) => (
            <div key={item.menuId}>
              <CartItemCard
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
              <Separator />
            </div>
          ))}
        </div>

        {/* 메뉴 추가 버튼 */}
        <div className="px-4 py-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/restaurants/${restaurantId}`)}
          >
            + 더 담으러 가기
          </Button>
        </div>

        <div className="h-2 bg-muted/50" />

        {/* 주문 요약 */}
        <div className="px-4 py-4">
          <OrderSummary
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            minOrderAmount={minOrderAmount}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-4 mt-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      {/* 하단 주문 버튼 */}
      <div className="fixed bottom-14 left-0 right-0 border-t bg-background px-4 py-3 safe-area-inset-bottom">
        <Button
          className="w-full py-6 text-base font-semibold"
          size="lg"
          disabled={isBelowMinimum || isLoading || isPending}
          onClick={handlePlaceOrder}
        >
          {isPending
            ? "주문 처리 중..."
            : isBelowMinimum
              ? `최소주문금액 ${minOrderAmount.toLocaleString()}원`
              : `${(subtotal + deliveryFee).toLocaleString()}원 주문하기`}
        </Button>
      </div>
    </div>
  );
}
