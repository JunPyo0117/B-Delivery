"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, List, User } from "lucide-react";
import { cn } from "@/shared/lib";

/** 하단 네비게이션 탭 정의 (3탭) */
const tabs = [
  { href: "/rider", label: "배달대기", icon: Bike },
  { href: "/rider/history", label: "배달내역", icon: List },
  { href: "/rider/mypage", label: "마이", icon: User },
] as const;

/** 하단 네비게이션 바를 숨길 경로 패턴 */
const HIDDEN_PATH_PREFIXES = ["/rider/active"];

/**
 * 배달기사 전용 하단 네비게이션 바
 * - 3탭: 배달대기, 배달내역, 마이
 * - 배달 진행 중(/rider/active)에서는 숨김
 * - 활성 탭: #2DB400 색상
 */
export function RiderBottomNav() {
  const pathname = usePathname();

  // 배달 진행 중에는 숨김
  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t bg-white"
      style={{ borderColor: "#EEEEEE" }}
      aria-label="기사 하단 네비게이션"
    >
      <ul
        className="flex items-center justify-around pb-5"
        style={{ height: "80px" }}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/rider"
              ? pathname === "/rider"
              : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive
                    ? "text-[#2DB400] font-semibold"
                    : "text-[#999999]"
                )}
                style={{ fontSize: "10px" }}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="size-[22px]"
                  strokeWidth={isActive ? 2.5 : 1.5}
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
