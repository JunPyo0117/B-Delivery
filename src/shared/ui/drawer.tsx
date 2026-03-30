"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

/** 바텀시트 Overlay */
function DrawerOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

/** 바텀시트 컨테이너 */
interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  // ESC 키로 닫기
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onOpenChange(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onOpenChange]);

  // 열릴 때 body 스크롤 방지
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <DrawerOverlay open={open} onClose={() => onOpenChange(false)} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-background shadow-lg transition-transform duration-300 ease-out",
          "max-h-[90vh]",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>
        {children}
      </div>
    </>
  );
}

export function DrawerContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-4 pb-4", className)}>
      {children}
    </div>
  );
}

export function DrawerFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        className
      )}
    >
      {children}
    </div>
  );
}
