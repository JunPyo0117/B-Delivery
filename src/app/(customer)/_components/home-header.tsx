"use client";

import Link from "next/link";
import { Bell, ChevronDown, ShoppingCart } from "lucide-react";

interface HomeHeaderProps {
  address: string | null;
}

export function HomeHeader({ address }: HomeHeaderProps) {
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
          <Link href="/cart" className="text-gray-700">
            <ShoppingCart className="size-[22px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
