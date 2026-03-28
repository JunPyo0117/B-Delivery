"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/shared/lib/utils";

const navItems = [
  {
    label: "대시보드",
    href: "/admin/dashboard",
    icon: "📊",
  },
  {
    label: "사용자 관리",
    href: "/admin/users",
    icon: "👤",
  },
  {
    label: "음식점 관리",
    href: "/admin/restaurants",
    icon: "🏪",
  },
  {
    label: "주문 관리",
    href: "/admin/orders",
    icon: "📋",
  },
  {
    label: "신고 관리",
    href: "/admin/reports",
    icon: "🚨",
  },
  {
    label: "배달기사 관리",
    href: "/admin/riders",
    icon: "🏍",
  },
  {
    label: "배달 현황",
    href: "/admin/monitoring",
    icon: "📍",
  },
  {
    label: "고객센터",
    href: "/admin/cs",
    icon: "💬",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r bg-card">
      {/* 로고 */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin/dashboard" className="text-lg font-bold text-primary">
          B-Delivery Admin
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단 */}
      <div className="border-t p-3 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <span className="text-base">🏠</span>
          서비스 홈으로
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"
        >
          <span className="text-base">🚪</span>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
