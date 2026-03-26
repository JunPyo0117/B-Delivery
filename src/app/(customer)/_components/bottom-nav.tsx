"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

/** 하단 네비게이션 탭 정의 (4탭) */
const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/favorites", label: "찜", icon: Heart },
  { href: "/orders", label: "주문내역", icon: ClipboardList },
  { href: "/mypage", label: "마이페이지", icon: User },
] as const;

/** 하단 네비게이션 바를 숨길 경로 패턴 */
const HIDDEN_PATH_PREFIXES = ["/chat/", "/restaurants/", "/cart"];

/**
 * 글로벌 하단 네비게이션 바
 * - 고객 페이지 전체에 표시 (채팅방, 음식점 상세 제외)
 * - 현재 경로 기반 활성 탭 하이라이트
 */
export function BottomNav() {
  const pathname = usePathname();

  // 특정 페이지에서는 BottomNav 숨김
  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t bg-white"
      style={{ borderColor: "#EEEEEE" }}
      aria-label="하단 네비게이션"
    >
      <ul className="flex items-center justify-around pb-5" style={{ height: "80px" }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive
                    ? "text-[#2DB400] font-semibold"
                    : "text-[#999999]",
                )}
                style={{ fontSize: "10px" }}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="size-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.5}
                  fill={isActive && href === "/favorites" ? "currentColor" : "none"}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
