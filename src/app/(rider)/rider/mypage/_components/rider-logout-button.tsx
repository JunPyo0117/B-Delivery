"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function RiderLogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/rider/login" })}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
    >
      <LogOut className="size-4" />
      로그아웃
    </button>
  );
}
