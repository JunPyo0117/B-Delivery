"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import type { CartItem } from "@/stores/cart";

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (menuId: string, quantity: number) => void;
  onRemove: (menuId: string) => void;
}

export function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) {
  const totalPrice = item.price * item.quantity;

  return (
    <div className="flex gap-3 py-4">
      {/* 메뉴 이미지 */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
            이미지 없음
          </div>
        )}
      </div>

      {/* 메뉴 정보 */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-medium leading-tight">{item.name}</h3>
          <button
            type="button"
            onClick={() => onRemove(item.menuId)}
            className="ml-2 shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`${item.name} 삭제`}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* 수량 조절 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.menuId, item.quantity - 1)}
              className="flex size-7 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              aria-label="수량 감소"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.menuId, item.quantity + 1)}
              disabled={item.quantity >= 99}
              className="flex size-7 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
              aria-label="수량 증가"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* 가격 */}
          <span className="text-sm font-semibold">
            {totalPrice.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  );
}
