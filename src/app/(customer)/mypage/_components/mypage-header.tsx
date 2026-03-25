"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function MypageHeader() {
  return (
    <header className="flex items-center justify-between px-4 h-12">
      <h1 className="text-lg font-bold">마이배민</h1>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        aria-label="로그아웃"
      >
        <LogOut className="size-4" />
      </Button>
    </header>
  );
}
