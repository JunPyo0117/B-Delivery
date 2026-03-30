"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/features/cart/model/cartStore";

interface RestaurantHeaderProps {
  imageUrl: string | null;
  name: string;
}

export function RestaurantHeader({ imageUrl, name }: RestaurantHeaderProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const totalQuantity = useCartStore((s) => s.getTotalQuantity());

  useEffect(() => setMounted(true), []);

  return (
    <div className="relative h-[220px] w-full bg-muted">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          이미지 없음
        </div>
      )}

      {/* 상단 그라데이션 오버레이 */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

      {/* 상단 네비게이션 오버레이 */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
        <button
          onClick={() => router.back()}
          className="flex size-9 items-center justify-center rounded-full text-white"
          aria-label="뒤로 가기"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            className="flex size-9 items-center justify-center rounded-full text-white"
            aria-label="검색"
          >
            <Search className="size-5" />
          </button>
          <button
            onClick={() => router.push("/cart")}
            className="relative flex size-9 items-center justify-center rounded-full text-white"
            aria-label="장바구니"
          >
            <ShoppingCart className="size-5" />
            {mounted && totalQuantity > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#2DB400] text-[10px] font-bold text-white">
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 하단 '함께주문' 버튼 */}
      <div className="absolute bottom-3 right-4">
        <div className="flex items-center gap-1 rounded-md bg-white/90 px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          <span className="text-[#2DB400]">&#x1f4e6;</span>
          함께주문
        </div>
      </div>
    </div>
  );
}
