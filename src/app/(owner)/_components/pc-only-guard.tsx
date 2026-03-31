"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Monitor } from "lucide-react";

const emptySubscribe = () => () => {};

/**
 * PC 전용 가드 컴포넌트
 * 화면 너비가 1024px 미만인 경우 접근 차단 메시지를 표시합니다.
 */
export function PcOnlyGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    handleChange(mediaQuery);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (!mounted) {
    return (
      <div className="hidden lg:contents">
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-white px-6 text-center">
        <Monitor className="h-16 w-16 text-gray-400" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            PC에서 이용해주세요
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            사장님 페이지는 PC 환경(1024px 이상)에서
            <br />
            최적화되어 있습니다.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-[#2DB400] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#249900]"
        >
          고객 화면으로 이동
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
