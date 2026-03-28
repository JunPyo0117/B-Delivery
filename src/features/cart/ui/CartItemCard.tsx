"use client"

import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { formatPrice } from "@/shared/lib"
import type { CartItem } from "../model/cartStore"

interface CartItemCardProps {
  item: CartItem
  index: number
  onUpdateQuantity: (index: number, quantity: number) => void
  onRemove: (index: number) => void
}

export function CartItemCard({
  item,
  index,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) {
  const itemTotal = (item.price + item.optionPrice) * item.quantity

  return (
    <div className="flex gap-3 py-3">
      {/* 메뉴 이미지 */}
      {item.menuImageUrl && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={item.menuImageUrl}
            alt={item.menuName}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* 메뉴 정보 */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <h4 className="font-medium leading-tight">{item.menuName}</h4>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onRemove(index)}
            className="text-muted-foreground"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        {/* 선택 옵션 */}
        {item.selectedOptions.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {item.selectedOptions.map((opt, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {opt.optionName}
                {opt.extraPrice > 0 && ` (+${formatPrice(opt.extraPrice)})`}
              </p>
            ))}
          </div>
        )}

        {/* 가격 + 수량 */}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-sm">{formatPrice(itemTotal)}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onUpdateQuantity(index, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
