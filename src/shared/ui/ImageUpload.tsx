"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Camera, X, Loader2, AlertCircle } from "lucide-react";
import { useImageUpload } from "@/shared/lib/useImageUpload";
import { cn } from "@/shared/lib/utils";
import type { ImageCategory, ImageCompressOptions } from "@/types/upload";

interface ImageUploadProps {
  category: ImageCategory;
  onUploaded?: (objectKey: string, publicUrl: string) => void;
  onRemoved?: () => void;
  defaultImageUrl?: string;
  compressOptions?: Partial<ImageCompressOptions>;
  variant?: "square" | "circle" | "banner";
  className?: string;
  disabled?: boolean;
}

const variantStyles = {
  square: "w-32 h-32 rounded-lg",
  circle: "w-24 h-24 rounded-full",
  banner: "w-full h-48 rounded-xl",
};

export function ImageUpload({
  category,
  onUploaded,
  onRemoved,
  defaultImageUrl,
  compressOptions,
  variant = "square",
  className,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    defaultImageUrl ?? null
  );

  const { status, progress, error, upload, reset } = useImageUpload({
    category,
    compress: compressOptions,
    onSuccess: (objectKey, publicUrl) => {
      setPreview(publicUrl);
      onUploaded?.(objectKey, publicUrl);
    },
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      await upload(file);

      URL.revokeObjectURL(objectUrl);
      if (inputRef.current) inputRef.current.value = "";
    },
    [upload]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    reset();
    onRemoved?.();
  }, [reset, onRemoved]);

  const isLoading = status === "compressing" || status === "uploading";

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isLoading}
      />

      <div
        className={cn(
          "relative overflow-hidden border-2 border-dashed border-muted-foreground/25",
          "flex items-center justify-center cursor-pointer",
          "hover:border-muted-foreground/50 transition-colors",
          variantStyles[variant],
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && !isLoading && inputRef.current?.click()}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="업로드 이미지"
              fill
              className="object-cover"
              unoptimized={preview.startsWith("blob:")}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
                <span className="text-white text-xs">
                  {status === "compressing" ? "압축 중..." : `${progress}%`}
                </span>
              </div>
            )}
            {!isLoading && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black/80"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Camera className="w-8 h-8" />
            <span className="text-xs">이미지 추가</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 mt-2 text-destructive text-xs">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
