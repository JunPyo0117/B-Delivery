"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DifferentRestaurantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DifferentRestaurantDialog({
  open,
  onOpenChange,
  onConfirm,
}: DifferentRestaurantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>장바구니 변경</DialogTitle>
          <DialogDescription>
            장바구니에는 같은 가게의 메뉴만 담을 수 있습니다. 기존
            장바구니를 비우고 새로운 메뉴를 담으시겠습니까?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            담기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
