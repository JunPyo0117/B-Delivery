"use client"

import { formatPrice } from "@/shared/lib"

interface CartSummaryProps {
  totalItemPrice: number
  deliveryFee: number
  totalPrice: number
  minOrderAmount: number
  meetsMinOrder: boolean
}

export function CartSummary({
  totalItemPrice,
  deliveryFee,
  totalPrice,
  minOrderAmount,
  meetsMinOrder,
}: CartSummaryProps) {
  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">주문 금액</span>
        <span>{formatPrice(totalItemPrice)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">배달비</span>
        <span>{deliveryFee === 0 ? "무료" : formatPrice(deliveryFee)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between font-bold">
        <span>총 결제 금액</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>

      {!meetsMinOrder && (
        <p className="mt-2 text-sm text-destructive font-medium">
          최소 주문금액 {formatPrice(minOrderAmount)} 이상 주문해 주세요.
          (현재 {formatPrice(totalItemPrice)})
        </p>
      )}
    </div>
  )
}
