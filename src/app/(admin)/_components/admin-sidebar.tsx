"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/shared/lib/utils";
import {
  LayoutDashboard,
  Users,
  Store,
  ClipboardList,
  Flag,
  Bike,
  MapPin,
  MessageCircle,
  Home,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "대시보드", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "사용자 관리", href: "/admin/users", icon: Users },
  { label: "음식점 관리", href: "/admin/restaurants", icon: Store },
  { label: "주문 관리", href: "/admin/orders", icon: ClipboardList },
  { label: "신고 관리", href: "/admin/reports", icon: Flag },
  { label: "배달기사 관리", href: "/admin/riders", icon: Bike },
  { label: "배달 현황", href: "/admin/monitoring", icon: MapPin },
  { label: "고객센터", href: "/admin/cs", icon: MessageCircle },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col bg-[#1A1A2E]">
      {/* 로고 */}
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand">
          <span className="text-xs font-bold text-white">B</span>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-sm font-semibold text-white"
        >
          B-Delivery
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 space-y-0.5 px-3 pt-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-brand/20 text-brand"
                  : "text-white/50 hover:bg-white/10 hover:text-white/80"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px]",
                  isActive ? "text-brand" : "text-[#9999AA]"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단 */}
      <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-white/50 hover:bg-white/10 hover:text-white/80"
        >
          <Home className="h-[18px] w-[18px] text-[#9999AA]" />
          서비스 홈으로
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-[18px] w-[18px]" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
