"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, UtensilsCrossed, MessageCircle, Store } from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/owner/dashboard",
    label: "대시보드",
    icon: LayoutDashboard,
  },
  {
    href: "/owner/orders",
    label: "주문관리",
    icon: ClipboardList,
  },
  {
    href: "/owner/menus",
    label: "메뉴관리",
    icon: UtensilsCrossed,
  },
  {
    href: "/owner/restaurant-info",
    label: "가게정보",
    icon: Store,
  },
  {
    href: "/owner/chat",
    label: "채팅",
    icon: MessageCircle,
  },
] as const;

/** Owner 전용 상단 네비게이션 바 — 그린 테마 */
export function OwnerNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: "#2DB400" }}>
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/owner/dashboard" className="text-lg font-bold text-white">
          B-Delivery 사장님
        </Link>
        <Link
          href="/"
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          고객 화면
        </Link>
      </div>

      <nav className="flex border-t border-white/20">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-b-2 border-white text-white"
                  : "text-white/60 hover:text-white/80"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
