"use client"

import { useState, useTransition } from "react"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Textarea } from "@/shared/ui/textarea"
import { cancelOrder } from "@/entities/order/api/cancelOrder"
import { CUSTOMER_CANCELLABLE } from "@/entities/order"
import type { OrderStatus } from "@/generated/prisma/client"

interface CancelOrderButtonProps {
  orderId: string
  userId: string
  currentStatus: OrderStatus
  onCancelled?: () => void
  className?: string
}

/**
 * 주문 취소 버튼
 * - PENDING/COOKING 상태에서만 표시
 * - COOKING: 취소 수수료 안내 포함
 */
export function CancelOrderButton({
  orderId,
  userId,
  currentStatus,
  onCancelled,
  className,
}: CancelOrderButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!CUSTOMER_CANCELLABLE.includes(currentStatus)) {
    return null
  }

  const isCooking = currentStatus === "COOKING"

  const handleCancel = () => {
    if (!reason.trim()) {
      setError("취소 사유를 입력해주세요.")
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await cancelOrder(userId, orderId, reason.trim())
      if (result.success) {
        setOpen(false)
        setReason("")
        onCancelled?.()
      } else {
        setError(result.error ?? "주문 취소에 실패했습니다.")
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        className={className}
        onClick={() => setOpen(true)}
      >
        주문 취소
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문을 취소하시겠어요?</DialogTitle>
            <DialogDescription>
              {isCooking
                ? "조리가 시작된 주문입니다. 취소 시 취소 수수료가 발생할 수 있습니다."
                : "주문을 취소하면 되돌릴 수 없습니다."}
            </DialogDescription>
          </DialogHeader>

          {isCooking && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              조리 중 취소 시 음식 준비 비용이 취소 수수료로 부과될 수 있습니다.
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="cancel-reason"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              취소 사유
            </label>
            <Textarea
              id="cancel-reason"
              placeholder="취소 사유를 입력해주세요"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              돌아가기
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
            >
              {isPending ? "취소 중..." : "주문 취소"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
