"use client";

import Link from "next/link";
import { ChevronDown, ShoppingCart } from "lucide-react";

interface HomeHeaderProps {
  address: string | null;
}

export function HomeHeader({ address }: HomeHeaderProps) {
  const displayAddress = address
    ? address.length > 15
      ? address.slice(0, 15) + "..."
      : address
    : "주소를 설정해주세요";

  return (
    <header className="sticky top-0 z-40 bg-[#2AC1BC] px-4 pb-3 pt-3">
      <div className="flex items-center justify-between">
        <Link
          href="/mypage/addresses"
          className="flex items-center gap-1 text-white"
        >
          <span className="text-sm font-bold">{displayAddress}</span>
          <ChevronDown className="size-4" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/cart" className="text-white">
            <ShoppingCart className="size-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
