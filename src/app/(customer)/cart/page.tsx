"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, ChevronRight, Store, Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";
import { getRestaurantDeliveryInfo, createOrder } from "./actions";

type TabType = "delivery" | "grocery" | "deal";

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
    getTotalQuantity,
    setDeliveryInfo,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("delivery");

  // Zustand persist hydration 대기
  useEffect(() => {
    setMounted(true);
  }, []);

  // 음식점 배달 정보 가져오기
  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted, restaurantId, setDeliveryInfo]);

  const subtotal = mounted ? getTotal() : 0;
  const totalQuantity = mounted ? getTotalQuantity() : 0;
  const isBelowMinimum = subtotal < minOrderAmount;
  const isEmpty = !mounted || items.length === 0;
  const total = subtotal + deliveryFee;

  /** 주문 확정 핸들러 */
  const handlePlaceOrder = () => {
    if (!restaurantId || items.length === 0) return;
    setError(null);

    startTransition(async () => {
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
          clearCart();
        }
      } catch {
        setError("주문 처리 중 오류가 발생했습니다.");
      }
    });
  };

  // 탭 헤더
  const TabHeader = () => (
    <>
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 h-12">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="size-5 text-gray-900" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">장바구니</h1>
        <button type="button" className="p-1" aria-label="공유">
          <UserPlus className="size-5 text-gray-900" />
        </button>
      </header>

      {/* 탭 */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab("delivery")}
          className={`flex-1 py-3 text-[13px] font-semibold text-center relative transition-colors ${
            activeTab === "delivery" ? "text-gray-900" : "text-gray-400"
          }`}
        >
          배달·픽업{!isEmpty && activeTab === "delivery" && ` ${totalQuantity}`}
          {activeTab === "delivery" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("grocery")}
          className={`flex-1 py-3 text-[13px] font-semibold text-center relative transition-colors ${
            activeTab === "grocery" ? "text-gray-900" : "text-gray-400"
          }`}
        >
          장보기·쇼핑
          {activeTab === "grocery" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("deal")}
          className={`flex-1 py-3 text-[13px] font-semibold text-center relative transition-colors ${
            activeTab === "deal" ? "text-gray-900" : "text-gray-400"
          }`}
        >
          전국특가
          {activeTab === "deal" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900" />
          )}
        </button>
      </div>
    </>
  );

  // 빈 장바구니 화면
  if (!isLoading && isEmpty) {
    return (
      <div className="flex min-h-dvh flex-col bg-white">
        <TabHeader />

        {/* 빈 상태 */}
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-[15px] font-medium text-gray-900">담은 메뉴가 없어요</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 rounded-full border border-gray-300 px-5 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            가게 둘러보기
          </button>
        </div>

        {/* 놓치면 아까운 할인가게 */}
        <div className="mt-2 bg-white">
          <div className="flex items-center gap-1.5 px-4 py-3">
            <span className="text-[15px] font-bold text-gray-900">놓치면 아까운 할인가게</span>
            <span className="text-gray-400 text-xs">ⓘ</span>
          </div>
          <p className="px-4 -mt-1 mb-3 text-[11px] text-gray-400">
            2천원 또는 10% 이상 즉시할인 중
          </p>

          {/* 추천 가게 플레이스홀더 */}
          <div className="space-y-0 divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 px-4 py-3">
                <div className="size-[72px] shrink-0 rounded-lg bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <div className="h-3.5 w-32 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-48 bg-gray-50 rounded mb-1.5" />
                  <div className="h-3 w-24 bg-gray-50 rounded mb-2" />
                  <div className="flex gap-1.5">
                    <span className="bg-[#2DB400]/10 text-[#2DB400] text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      할인중
                    </span>
                    <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">
                      배달가능
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <TabHeader />

      {/* 컨텐츠 */}
      <div className="flex-1 pb-36">
        {/* 가게 정보 */}
        <div className="bg-white mt-0">
          <button
            type="button"
            onClick={() => router.push(`/restaurants/${restaurantId}`)}
            className="flex items-center gap-2.5 w-full px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-center size-8 rounded-full bg-gray-100">
              <Store className="size-4 text-gray-500" />
            </div>
            <span className="text-[14px] font-bold text-gray-900 flex-1 text-left">
              {restaurantName}
            </span>
            <ChevronRight className="size-4 text-gray-400" />
          </button>
        </div>

        {/* 장바구니 아이템 목록 */}
        <div className="bg-white mt-0 border-t border-gray-100">
          {items.map((item, idx) => {
            const totalPrice = item.price * item.quantity;
            return (
              <div
                key={item.menuId}
                className={`px-4 py-4 ${idx > 0 ? "border-t border-gray-100" : ""}`}
              >
                <div className="flex gap-3">
                  {/* 메뉴 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-900 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">
                      가격 : {item.price.toLocaleString()}원
                    </p>
                    <p className="text-[15px] font-bold text-gray-900 mt-2">
                      {totalPrice.toLocaleString()}원
                    </p>
                  </div>

                  {/* 메뉴 이미지 */}
                  <div className="relative h-[90px] w-[90px] shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="90px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                </div>

                {/* 옵션/수량 컨트롤 */}
                <div className="flex items-center justify-between mt-3">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-[12px] text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                  >
                    옵션 변경
                  </button>

                  <div className="flex items-center gap-0">
                    <button
                      type="button"
                      onClick={() => removeItem(item.menuId)}
                      className="flex items-center justify-center size-8 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="삭제"
                    >
                      <Trash2 className="size-[18px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                      className="flex items-center justify-center size-8 rounded-l-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                      disabled={item.quantity <= 1}
                      aria-label="수량 감소"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="flex items-center justify-center w-8 h-8 border-y border-gray-300 text-[13px] font-semibold text-gray-900 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                      disabled={item.quantity >= 99}
                      className="flex items-center justify-center size-8 rounded-r-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                      aria-label="수량 증가"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 메뉴 추가 */}
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={() => router.push(`/restaurants/${restaurantId}`)}
            className="text-[13px] font-semibold text-[#2DB400] flex items-center gap-0.5"
          >
            <Plus className="size-3.5" />
            메뉴 추가
          </button>
        </div>

        {/* 결제 금액 섹션 */}
        <div className="bg-white mt-2 px-4 py-4">
          <h3 className="text-[14px] font-bold text-gray-900 mb-3">결제금액</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-500">주문금액</span>
              <span className="text-gray-700">{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-gray-500">배달비</span>
              <span className="text-gray-700">
                {deliveryFee === 0 ? "무료" : `${deliveryFee.toLocaleString()}원`}
              </span>
            </div>
          </div>

          {/* 최소주문금액 미달 안내 */}
          {isBelowMinimum && (
            <p className="text-[12px] text-[#FF5252] mt-2">
              최소주문금액 {minOrderAmount.toLocaleString()}원까지{" "}
              {(minOrderAmount - subtotal).toLocaleString()}원 남았어요
            </p>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-4 mt-2 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-[#FF5252]">
            {error}
          </div>
        )}
      </div>

      {/* 하단 주문 버튼 (sticky) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white border-t border-gray-200">
        <div className="px-4 py-3">
          {/* 가격 정보 */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[20px] font-extrabold text-gray-900">
              {total.toLocaleString()}원
            </span>
            {deliveryFee > 0 && (
              <>
                <span className="text-[13px] text-gray-400 line-through">
                  {(total + Math.round(total * 0.05)).toLocaleString()}원
                </span>
                <span className="bg-[#2DB400]/10 text-[#2DB400] text-[11px] font-bold px-1.5 py-0.5 rounded">
                  할인 적용
                </span>
              </>
            )}
          </div>

          {/* CTA 버튼 */}
          <Button
            className="w-full h-12 rounded-lg text-[15px] font-bold"
            style={{ backgroundColor: "#2DB400" }}
            disabled={isBelowMinimum || isLoading || isPending}
            onClick={handlePlaceOrder}
          >
            {isPending
              ? "주문 처리 중..."
              : isBelowMinimum
                ? `최소주문금액 ${minOrderAmount.toLocaleString()}원`
                : "한집배달 주문하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
