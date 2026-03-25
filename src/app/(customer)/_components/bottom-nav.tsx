"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Search, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/categories", label: "카테고리", icon: Search },
  { href: "/favorites", label: "찜", icon: Heart },
  { href: "/orders", label: "주문내역", icon: ClipboardList },
  { href: "/mypage", label: "마이배민", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // 채팅방, 음식점 상세에서는 BottomNav 숨김
  if (pathname.startsWith("/chat/") || pathname.startsWith("/restaurants/"))
    return null;

  return (
    <nav className="sticky bottom-0 z-50 border-t bg-background">
      <ul className="flex items-center justify-around h-14">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px]",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" strokeWidth={isActive ? 2.5 : 1.5} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
