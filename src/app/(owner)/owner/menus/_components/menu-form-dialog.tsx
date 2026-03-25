"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createMenu, updateMenu, type MenuFormData } from "../actions";
import type { PresignedUrlResponse } from "@/types/upload";

/** 메뉴 카테고리 프리셋 */
const MENU_CATEGORIES = [
  "인기 메뉴",
  "메인 메뉴",
  "사이드",
  "음료",
  "세트 메뉴",
  "기타",
] as const;

interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 수정 시 기존 메뉴 데이터 */
  editMenu?: {
    id: string;
    name: string;
    category: string;
    price: number;
    description: string | null;
    imageUrl: string | null;
  } | null;
}

export function MenuFormDialog({
  open,
  onOpenChange,
  editMenu,
}: MenuFormDialogProps) {
  const isEdit = !!editMenu;

  const [name, setName] = useState(editMenu?.name ?? "");
  const [category, setCategory] = useState(editMenu?.category ?? "메인 메뉴");
  const [price, setPrice] = useState(editMenu?.price?.toString() ?? "");
  const [description, setDescription] = useState(
    editMenu?.description ?? ""
  );
  const [imageUrl, setImageUrl] = useState(editMenu?.imageUrl ?? "");
  const [imagePreview, setImagePreview] = useState(editMenu?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // editMenu 변경 시 폼 동기화
  useEffect(() => {
    if (open) {
      setName(editMenu?.name ?? "");
      setCategory(editMenu?.category ?? "메인 메뉴");
      setPrice(editMenu?.price?.toString() ?? "");
      setDescription(editMenu?.description ?? "");
      setImageUrl(editMenu?.imageUrl ?? "");
      setImagePreview(editMenu?.imageUrl ?? "");
      setError("");
    }
  }, [open, editMenu]);

  function resetForm() {
    setName("");
    setCategory("메인 메뉴");
    setPrice("");
    setDescription("");
    setImageUrl("");
    setImagePreview("");
    setError("");
  }

  function handleClose() {
    if (!isPending && !uploading) {
      resetForm();
      onOpenChange(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 미리보기
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setError("");

    try {
      // 1. Presigned URL 요청
      const res = await fetch("/api/upload/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "menu",
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "업로드 URL 생성 실패");
      }

      const { uploadUrl, publicUrl }: PresignedUrlResponse = await res.json();

      // 2. MinIO에 직접 업로드
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("이미지 업로드에 실패했습니다.");
      }

      setImageUrl(publicUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다."
      );
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedPrice = parseInt(price, 10);
    if (!name.trim()) {
      setError("메뉴 이름을 입력해주세요.");
      return;
    }
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("올바른 가격을 입력해주세요.");
      return;
    }

    const formData: MenuFormData = {
      name: name.trim(),
      category,
      price: parsedPrice,
      description: description.trim() || undefined,
      imageUrl: imageUrl || undefined,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateMenu(editMenu!.id, formData)
        : await createMenu(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      resetForm();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "메뉴 수정" : "새 메뉴 등록"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* 이미지 업로드 */}
          <div className="space-y-2">
            <Label>메뉴 이미지</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative h-24 w-24 rounded-lg overflow-hidden border">
                  <Image
                    src={imagePreview}
                    alt="메뉴 미리보기"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs">이미지</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/webp,image/jpeg,image/png,image/gif"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* 메뉴명 */}
          <div className="space-y-2">
            <Label htmlFor="menu-name">
              메뉴명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="menu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 양념치킨"
              required
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="menu-category">
              카테고리 <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    category === cat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 가격 */}
          <div className="space-y-2">
            <Label htmlFor="menu-price">
              가격 (원) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="menu-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="예: 18000"
              min={0}
              required
            />
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="menu-desc">설명</Label>
            <Textarea
              id="menu-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="메뉴 설명을 입력하세요"
              rows={3}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          {/* 버튼 */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending || uploading}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : isEdit ? (
                "수정"
              ) : (
                "등록"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
