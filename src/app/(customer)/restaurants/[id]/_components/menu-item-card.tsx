"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface MenuItemCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isSoldOut: boolean;
  rank?: number;
  reviewCount?: number;
  onClick?: () => void;
}

export function MenuItemCard({
  name,
  description,
  price,
  imageUrl,
  isSoldOut,
  rank,
  reviewCount,
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
        "flex items-start gap-3 py-4",
        isSoldOut && "opacity-40",
        !isSoldOut && "cursor-pointer active:bg-gray-50 transition-colors"
      )}
    >
      {/* 메뉴 정보 (왼쪽) */}
      <div className="flex-1 min-w-0 pr-1">
        {/* 배지 */}
        {rank && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="rounded bg-[#FF6B00]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#FF6B00]">
              인기{rank}위
            </span>
            <span className="rounded bg-[#2DB400]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#2DB400]">
              사장님추천
            </span>
          </div>
        )}

        <h4 className="text-[15px] font-semibold text-gray-900">{name}</h4>

        {description && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-[1.4] text-gray-500">
            {description}
          </p>
        )}

        <p className="mt-1.5 text-[15px] font-bold text-gray-900">
          {price.toLocaleString()}원
        </p>

        {isSoldOut && (
          <span className="mt-1 inline-block text-xs font-semibold text-[#FF5252]">
            품절
          </span>
        )}

        {reviewCount !== undefined && reviewCount > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            리뷰 {reviewCount}
          </p>
        )}
      </div>

      {/* 메뉴 이미지 + 추가 버튼 (오른쪽) */}
      <div className="relative flex-shrink-0">
        {imageUrl ? (
          <div className="relative size-[100px] overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="100px"
            />
          </div>
        ) : (
          <div className="size-[100px] rounded-lg bg-gray-100" />
        )}
        {!isSoldOut && (
          <button
            className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-transform active:scale-95"
            aria-label={`${name} 담기`}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <Plus className="size-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
}
