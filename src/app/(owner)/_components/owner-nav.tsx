"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, UtensilsCrossed } from "lucide-react";

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
] as const;

/** Owner 전용 상단 네비게이션 바 */
export function OwnerNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/owner/dashboard" className="text-lg font-bold text-primary">
          B-Delivery 사장님
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          고객 화면
        </Link>
      </div>

      <nav className="flex border-t">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
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
