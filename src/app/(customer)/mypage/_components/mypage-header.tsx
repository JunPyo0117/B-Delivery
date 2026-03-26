"use client";

import { Headphones, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function MypageHeader() {
  return (
    <header className="flex items-center justify-between px-4 h-14">
      <h1 className="text-[22px] font-bold tracking-tight">마이배민</h1>
      <div className="flex items-center gap-3">
        <Link
          href="/chat"
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="고객센터"
        >
          <Headphones className="size-[22px]" />
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="로그아웃"
        >
          <Settings className="size-[22px]" />
        </button>
      </div>
    </header>
  );
}
