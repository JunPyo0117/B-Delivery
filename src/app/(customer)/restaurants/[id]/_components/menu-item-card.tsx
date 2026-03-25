"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isSoldOut: boolean;
  onClick?: () => void;
}

export function MenuItemCard({
  name,
  description,
  price,
  imageUrl,
  isSoldOut,
  onClick,
}: MenuItemCardProps) {
  return (
    <div
      role={isSoldOut ? undefined : "button"}
      tabIndex={isSoldOut ? undefined : 0}
      onClick={isSoldOut ? undefined : onClick}
      onKeyDown={
        isSoldOut
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
      }
      className={cn(
        "flex items-center gap-3 py-4",
        isSoldOut && "opacity-50",
        !isSoldOut && "cursor-pointer active:bg-muted/50 transition-colors"
      )}
    >
      {/* 메뉴 정보 */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium">{name}</h4>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        )}
        <p className="mt-1 text-sm font-semibold">
          {price.toLocaleString()}원
        </p>
        {isSoldOut && (
          <span className="text-xs font-medium text-destructive">품절</span>
        )}
      </div>

      {/* 메뉴 이미지 + 추가 버튼 */}
      <div className="relative flex-shrink-0">
        {imageUrl ? (
          <div className="relative size-20 overflow-hidden rounded-lg bg-muted">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        ) : (
          <div className="size-20 rounded-lg bg-muted" />
        )}
        {!isSoldOut && (
          <span
            className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full border bg-background shadow-sm"
            aria-hidden="true"
          >
            <Plus className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
}
