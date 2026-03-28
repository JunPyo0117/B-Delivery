"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, ChevronDown, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/features/cart/model/cartStore";

interface HomeHeaderProps {
  address: string | null;
}

export function HomeHeader({ address }: HomeHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const totalQuantity = useCartStore((s) => s.getTotalQuantity());

  useEffect(() => setMounted(true), []);

  const displayAddress = address
    ? address.length > 15
      ? address.slice(0, 15) + "..."
      : address
    : "우리집";

  return (
    <header className="sticky top-0 z-40 bg-white px-4 pt-3 pb-1">
      <div className="flex items-center justify-between">
        <Link
          href="/mypage/addresses"
          className="flex items-center gap-0.5 text-black"
        >
          <span className="text-[15px] font-bold">{displayAddress}</span>
          <ChevronDown className="size-4 text-gray-600" />
        </Link>
        <div className="flex items-center gap-4">
          <button type="button" aria-label="알림" className="text-gray-700">
            <Bell className="size-[22px]" />
          </button>
          <Link href="/cart" className="relative text-gray-700" aria-label="장바구니">
            <ShoppingCart className="size-[22px]" />
            {mounted && totalQuantity > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-[18px] items-center justify-center rounded-full bg-[#2DB400] text-[10px] font-bold text-white">
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
