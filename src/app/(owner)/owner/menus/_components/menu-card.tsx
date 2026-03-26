"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
      <div className="flex items-center gap-3 px-4 py-3">
        {/* 썸네일 64x64 */}
        <div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 transition-opacity ${isSoldOut ? "opacity-50" : ""}`}>
          {menu.imageUrl ? (
            <Image
              src={menu.imageUrl}
              alt={menu.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-gray-300">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* 메뉴 정보 */}
        <div className={`flex-1 min-w-0 transition-opacity ${isSoldOut ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[15px] text-gray-900 truncate">
              {menu.name}
            </h3>
            {isSoldOut && (
              <span
                className="shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: "#FF5252" }}
              >
                품절
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">
            {formattedPrice}원
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{menu.category}</p>
          {error && (
            <p className="text-xs mt-1" style={{ color: "#FF5252" }}>
              {error}
            </p>
          )}
        </div>

        {/* 오른쪽: 토글 + 수정 */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Switch
            checked={!isSoldOut}
            onCheckedChange={handleToggleSoldOut}
            disabled={isPending}
            className="data-[state=checked]:bg-[#2DB400]"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              수정
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="text-xs font-medium transition-colors"
              style={{ color: "#FF5252" }}
            >
              삭제
            </button>
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
