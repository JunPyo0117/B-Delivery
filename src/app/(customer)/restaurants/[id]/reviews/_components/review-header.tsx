"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart";

export function ReviewHeader() {
  const router = useRouter();
  const totalQuantity = useCartStore((s) => s.getTotalQuantity());

  return (
    <div className="sticky top-0 z-10 flex h-12 items-center justify-between bg-white px-4">
      <button
        onClick={() => router.back()}
        className="flex size-9 items-center justify-center"
        aria-label="뒤로 가기"
      >
        <ArrowLeft className="size-5 text-gray-900" />
      </button>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-bold text-gray-900">
        리뷰
      </h1>

      <button
        onClick={() => router.push("/cart")}
        className="relative flex size-9 items-center justify-center"
        aria-label="장바구니"
      >
        <ShoppingCart className="size-5 text-gray-900" />
        {totalQuantity > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#2DB400] text-[10px] font-bold text-white">
            {totalQuantity > 99 ? "99+" : totalQuantity}
          </span>
        )}
      </button>
    </div>
  );
}
