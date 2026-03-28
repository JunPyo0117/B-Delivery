"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MenuItemData } from "../model/types";

interface MenuItemCardProps {
  item: MenuItemData;
  rank?: number; // 인기 메뉴 순위 (1, 2, 3...)
  onAddToCart?: (item: MenuItemData) => void;
}

export function MenuItemCard({ item, rank, onAddToCart }: MenuItemCardProps) {
  const {
    name,
    price,
    description,
    imageUrl,
    isSoldOut,
    isPopular,
    isNew,
    optionGroups,
  } = item;

  const hasOptions = optionGroups.length > 0;

  const handleAdd = () => {
    if (isSoldOut || !onAddToCart) return;
    onAddToCart(item);
  };

  return (
    <div
      className={`flex gap-3 py-4 border-b last:border-b-0 ${
        isSoldOut ? "opacity-50" : ""
      }`}
    >
      {/* 메뉴 정보 */}
      <div className="flex-1 min-w-0">
        {/* 뱃지들 */}
        <div className="flex items-center gap-1.5 mb-1">
          {rank !== undefined && (
            <Badge variant="outline" className="text-xs font-bold px-1.5">
              인기 {rank}위
            </Badge>
          )}
          {isPopular && !rank && (
            <Badge variant="outline" className="text-xs font-bold px-1.5">
              인기
            </Badge>
          )}
          {isNew && (
            <Badge
              variant="default"
              className="text-xs bg-red-500 text-white px-1.5"
            >
              NEW
            </Badge>
          )}
          {isSoldOut && (
            <Badge variant="secondary" className="text-xs px-1.5">
              품절
            </Badge>
          )}
        </div>

        {/* 메뉴 이름 */}
        <h3 className="font-semibold text-base truncate">{name}</h3>

        {/* 설명 */}
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {description}
          </p>
        )}

        {/* 가격 */}
        <p className="font-bold text-base mt-1.5">
          {price.toLocaleString()}원
        </p>
      </div>

      {/* 이미지 + 담기 버튼 */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        {imageUrl ? (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-2xl">
            🍽️
          </div>
        )}

        {/* 담기 버튼: 옵션 없으면 바로 담기, 있으면 + 표시 */}
        <Button
          variant="outline"
          size="sm"
          disabled={isSoldOut}
          onClick={handleAdd}
          className="w-full text-xs"
        >
          {isSoldOut ? "품절" : hasOptions ? "선택" : "+담기"}
        </Button>
      </div>
    </div>
  );
}
