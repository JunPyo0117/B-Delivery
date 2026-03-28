"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Star,
  BarChart3,
  MessageCircle,
  Settings,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { toggleBusinessStatus } from "../_actions/toggle-business-status";

const NAV_ITEMS = [
  { href: "/owner/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/owner/orders", label: "주문관리", icon: ClipboardList },
  { href: "/owner/menus", label: "메뉴관리", icon: UtensilsCrossed },
  { href: "/owner/reviews", label: "리뷰관리", icon: Star },
  { href: "/owner/stats", label: "매출통계", icon: BarChart3 },
  { href: "/owner/chat", label: "채팅", icon: MessageCircle },
  { href: "/owner/settings", label: "가게설정", icon: Settings },
] as const;

type BusinessStatus = "OPEN" | "CLOSED" | "PAUSED";

const STATUS_CONFIG: Record<BusinessStatus, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  OPEN: { label: "영업중", dotColor: "bg-green-500", bgColor: "bg-green-50", textColor: "text-green-700" },
  CLOSED: { label: "영업종료", dotColor: "bg-gray-400", bgColor: "bg-gray-50", textColor: "text-gray-600" },
  PAUSED: { label: "일시중지", dotColor: "bg-orange-500", bgColor: "bg-orange-50", textColor: "text-orange-700" },
};

interface OwnerSidebarProps {
  restaurantName: string;
  restaurantId: string;
  initialIsOpen: boolean;
}

export function OwnerSidebar({
  restaurantName,
  restaurantId,
  initialIsOpen,
}: OwnerSidebarProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [businessStatus, setBusinessStatus] = useState<BusinessStatus>(
    initialIsOpen ? "OPEN" : "CLOSED"
  );
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    targetStatus: BusinessStatus;
  }>({ open: false, targetStatus: "OPEN" });

  const currentConfig = STATUS_CONFIG[businessStatus];

  const handleStatusSelect = (status: BusinessStatus) => {
    if (status === businessStatus) {
      setStatusDropdownOpen(false);
      return;
    }
    setConfirmDialog({ open: true, targetStatus: status });
    setStatusDropdownOpen(false);
  };

  const handleConfirmStatusChange = () => {
    const targetStatus = confirmDialog.targetStatus;
    // PAUSED와 CLOSED 모두 isOpen=false로 저장 (DB는 boolean만 지원)
    const isOpen = targetStatus === "OPEN";

    startTransition(async () => {
      try {
        await toggleBusinessStatus(restaurantId, isOpen);
        setBusinessStatus(targetStatus);
      } catch (error) {
        console.error("영업 상태 변경 실패:", error);
      }
    });

    setConfirmDialog({ open: false, targetStatus: "OPEN" });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[240px] flex-col border-r border-gray-200 bg-white">
      {/* 로고 / 가게명 */}
      <div className="border-b border-gray-100 px-5 py-5">
        <Link
          href="/owner/dashboard"
          className="text-lg font-bold text-[#2DB400]"
        >
          B-Delivery 사장님
        </Link>
        <p className="mt-1 truncate text-sm text-gray-500">{restaurantName}</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-l-[3px] border-l-[#2DB400] bg-green-50 text-green-700"
                      : "border-l-[3px] border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-green-600" : "text-gray-400"
                    )}
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 영업 상태 토글 */}
      <div className="border-t border-gray-200 px-4 py-4">
        <p className="mb-2 text-xs font-medium text-gray-400">영업 상태</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              currentConfig.bgColor,
              currentConfig.textColor
            )}
          >
            <span className="flex items-center gap-2">
              <span className={cn("inline-block h-2.5 w-2.5 rounded-full", currentConfig.dotColor)} />
              {currentConfig.label}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", statusDropdownOpen && "rotate-180")} />
          </button>

          {statusDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {(Object.entries(STATUS_CONFIG) as [BusinessStatus, typeof currentConfig][]).map(
                ([status, config]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusSelect(status)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-50",
                      status === businessStatus ? "font-medium text-gray-900" : "text-gray-600"
                    )}
                  >
                    <span className={cn("inline-block h-2 w-2 rounded-full", config.dotColor)} />
                    {config.label}
                    {status === businessStatus && <span className="ml-auto text-xs text-gray-400">현재</span>}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        <Link
          href="/"
          className="mt-3 block text-center text-xs text-gray-400 transition-colors hover:text-gray-600"
        >
          고객 화면으로 이동
        </Link>
      </div>

      {/* 영업 상태 변경 확인 다이얼로그 */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>영업 상태 변경</DialogTitle>
            <DialogDescription>
              영업 상태를 &apos;{STATUS_CONFIG[confirmDialog.targetStatus].label}
              &apos;(으)로 변경하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="bg-[#2DB400] text-white hover:bg-[#249900]"
              onClick={handleConfirmStatusChange}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "변경"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
