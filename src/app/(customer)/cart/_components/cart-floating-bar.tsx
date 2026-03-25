"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart";

/**
 * 장바구니에 아이템이 있을 때 하단에 표시되는 플로팅 바
 * 음식점 상세 페이지 등에서 사용
 */
export function CartFloatingBar() {
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const getTotalQuantity = useCartStore((s) => s.getTotalQuantity);
  const restaurantName = useCartStore((s) => s.restaurantName);

  const totalQuantity = getTotalQuantity();
  const total = getTotal();

  if (totalQuantity === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 safe-area-inset-bottom">
      <Link
        href="/cart"
        className="flex items-center justify-between rounded-2xl bg-[#00C4B4] px-5 py-3.5 text-white shadow-lg transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <ShoppingCart className="size-5" />
            <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#00C4B4]">
              {totalQuantity}
            </span>
          </div>
          <span className="ml-1 text-sm font-medium">{restaurantName}</span>
        </div>
        <span className="text-base font-bold">
          {total.toLocaleString()}원 배달주문
        </span>
      </Link>
    </div>
  );
}
