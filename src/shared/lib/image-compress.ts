import type { ImageCompressOptions } from "@/types/upload";

const DEFAULT_OPTIONS: ImageCompressOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
};

/**
 * 이미지 파일을 리사이즈 + WebP 압축
 * @returns WebP 형식의 Blob
 */
export async function compressImage(
  file: File,
  options: Partial<ImageCompressOptions> = {}
): Promise<Blob> {
  const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };

  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // OffscreenCanvas 우선 사용 (성능 이점)
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas.convertToBlob({ type: "image/webp", quality });
  }

  // 폴백: 일반 Canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("이미지 압축에 실패했습니다."));
      },
      "image/webp",
      quality
    );
  });
}

/** 파일 크기를 사람이 읽기 쉬운 형식으로 변환 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
