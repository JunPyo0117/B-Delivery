"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-3 w-full py-4 hover:bg-gray-50/50 transition-colors"
    >
      <span className="w-6 flex items-center justify-center text-gray-400">
        <LogOut className="size-[18px]" />
      </span>
      <span className="text-[15px] text-[#FF5252]">로그아웃</span>
    </button>
  )
}
