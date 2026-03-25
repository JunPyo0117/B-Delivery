"use client";

import { Separator } from "@/components/ui/separator";

interface OrderSummaryProps {
  subtotal: number;
  deliveryFee: number;
  minOrderAmount: number;
}

export function OrderSummary({
  subtotal,
  deliveryFee,
  minOrderAmount,
}: OrderSummaryProps) {
  const total = subtotal + deliveryFee;
  const isBelowMinimum = subtotal < minOrderAmount;
  const remainingAmount = minOrderAmount - subtotal;

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">결제 금액</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">주문금액</span>
          <span>{subtotal.toLocaleString()}원</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">배달비</span>
          <span>
            {deliveryFee === 0 ? "무료" : `${deliveryFee.toLocaleString()}원`}
          </span>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <span className="text-base font-semibold">총 결제금액</span>
        <span className="text-lg font-bold text-primary">
          {total.toLocaleString()}원
        </span>
      </div>

      {/* 최소주문금액 미달 안내 */}
      {isBelowMinimum && (
        <p className="text-xs text-destructive">
          최소주문금액 {minOrderAmount.toLocaleString()}원까지{" "}
          {remainingAmount.toLocaleString()}원 남았어요
        </p>
      )}
    </div>
  );
}
