"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { PresignedUrlResponse } from "@/types/upload";

interface ImageUploaderProps {
  imageUrls: string[];
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  imageUrls,
  onImagesChange,
  maxImages = 3,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - imageUrls.length;
    if (remainingSlots <= 0) {
      setError(`이미지는 최대 ${maxImages}장까지 업로드 가능합니다.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);
    setError(null);

    try {
      const newUrls: string[] = [];

      for (const file of filesToUpload) {
        // 파일 크기 체크 (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError("파일 크기는 5MB 이하여야 합니다.");
          continue;
        }

        // Presigned URL 요청
        const presignedRes = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "review",
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        if (!presignedRes.ok) {
          const errData = await presignedRes.json();
          throw new Error(errData.error || "업로드 URL 생성 실패");
        }

        const { uploadUrl, publicUrl }: PresignedUrlResponse =
          await presignedRes.json();

        // MinIO에 직접 업로드
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error("이미지 업로드에 실패했습니다.");
        }

        newUrls.push(publicUrl);
      }

      onImagesChange([...imageUrls, ...newUrls]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다."
      );
    } finally {
      setUploading(false);
      // input value 리셋
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    onImagesChange(newUrls);
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {imageUrls.map((url, index) => (
          <div
            key={url}
            className="relative size-20 shrink-0 overflow-hidden rounded-lg border"
          >
            <img
              src={url}
              alt={`리뷰 이미지 ${index + 1}`}
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label="이미지 삭제"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {imageUrls.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-muted-foreground/50",
              uploading && "pointer-events-none opacity-50"
            )}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Camera className="size-5" />
                <span className="text-xs">
                  {imageUrls.length}/{maxImages}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
