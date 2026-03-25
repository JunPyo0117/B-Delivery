"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toggleSoldOut, deleteMenu } from "../actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface MenuCardProps {
  menu: {
    id: string;
    name: string;
    category: string;
    price: number;
    description: string | null;
    imageUrl: string | null;
    isSoldOut: boolean;
  };
  onEdit: () => void;
}

export function MenuCard({ menu, onEdit }: MenuCardProps) {
  const [isSoldOut, setIsSoldOut] = useState(menu.isSoldOut);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [error, setError] = useState("");

  function handleToggleSoldOut() {
    startTransition(async () => {
      const result = await toggleSoldOut(menu.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsSoldOut(result.isSoldOut!);
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteMenu(menu.id);
      if (result.error) {
        setError(result.error);
        setDeleteDialogOpen(false);
        return;
      }
      setDeleteDialogOpen(false);
    });
  }

  const formattedPrice = new Intl.NumberFormat("ko-KR").format(menu.price);

  return (
    <>
      <div
        className={`flex gap-3 rounded-lg border bg-white p-3 transition-opacity ${
          isSoldOut ? "opacity-60" : ""
        }`}
      >
        {/* 이미지 */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {menu.imageUrl ? (
            <Image
              src={menu.imageUrl}
              alt={menu.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground">
              🍽
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-xs font-bold text-white">품절</span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{menu.name}</h3>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {menu.category}
              </Badge>
            </div>
            {menu.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {menu.description}
              </p>
            )}
            <p className="mt-1 font-semibold text-sm">{formattedPrice}원</p>
          </div>

          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>

        {/* 액션 */}
        <div className="flex flex-col items-end justify-between shrink-0">
          {/* 품절 토글 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {isSoldOut ? "품절" : "판매중"}
            </span>
            <Switch
              checked={!isSoldOut}
              onCheckedChange={handleToggleSoldOut}
              disabled={isPending}
            />
          </div>

          {/* 수정/삭제 */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onEdit}
              title="수정"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setDeleteDialogOpen(true)}
              title="삭제"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>메뉴 삭제</DialogTitle>
            <DialogDescription>
              &quot;{menu.name}&quot; 메뉴를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
