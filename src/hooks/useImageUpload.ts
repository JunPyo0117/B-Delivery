"use client";

import { useState, useCallback } from "react";
import { compressImage } from "@/lib/image-compress";
import type {
  ImageCategory,
  PresignedUrlResponse,
  UploadState,
  ImageCompressOptions,
} from "@/types/upload";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface UseImageUploadOptions {
  category: ImageCategory;
  compress?: Partial<ImageCompressOptions>;
  onSuccess?: (objectKey: string, publicUrl: string) => void;
  onError?: (error: string) => void;
}

const INITIAL_STATE: UploadState = {
  status: "idle",
  progress: 0,
  objectKey: null,
  publicUrl: null,
  error: null,
};

export function useImageUpload({
  category,
  compress,
  onSuccess,
  onError,
}: UseImageUploadOptions) {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const upload = useCallback(
    async (file: File) => {
      try {
        if (!ALLOWED_TYPES.includes(file.type)) {
          const msg = "이미지 파일만 업로드 가능합니다.";
          setState((prev) => ({ ...prev, status: "error", error: msg }));
          onError?.(msg);
          return;
        }

        // 압축 전 원본 크기 제한 (10MB)
        if (file.size > MAX_FILE_SIZE * 2) {
          const msg = "파일이 너무 큽니다. (최대 10MB)";
          setState((prev) => ({ ...prev, status: "error", error: msg }));
          onError?.(msg);
          return;
        }

        // 1. 압축
        setState({ ...INITIAL_STATE, status: "compressing" });
        const compressedBlob = await compressImage(file, compress);

        if (compressedBlob.size > MAX_FILE_SIZE) {
          const msg = "압축 후에도 파일이 5MB를 초과합니다.";
          setState((prev) => ({ ...prev, status: "error", error: msg }));
          onError?.(msg);
          return;
        }

        // 2. Presigned URL 요청
        setState((prev) => ({ ...prev, status: "uploading", progress: 10 }));

        const presignedRes = await fetch("/api/upload/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            contentType: "image/webp",
            fileSize: compressedBlob.size,
          }),
        });

        if (!presignedRes.ok) {
          const { error } = await presignedRes.json();
          throw new Error(error ?? "Presigned URL 생성 실패");
        }

        const { uploadUrl, objectKey, publicUrl }: PresignedUrlResponse =
          await presignedRes.json();

        // 3. MinIO에 직접 PUT 업로드 (XHR로 progress 추적)
        setState((prev) => ({ ...prev, progress: 30 }));

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", "image/webp");

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = 30 + Math.round((e.loaded / e.total) * 60);
              setState((prev) => ({ ...prev, progress: percent }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`업로드 실패 (HTTP ${xhr.status})`));
          };

          xhr.onerror = () =>
            reject(new Error("네트워크 오류로 업로드에 실패했습니다."));
          xhr.send(compressedBlob);
        });

        // 4. 완료
        setState({
          status: "done",
          progress: 100,
          objectKey,
          publicUrl,
          error: null,
        });
        onSuccess?.(objectKey, publicUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "알 수 없는 오류";
        setState((prev) => ({ ...prev, status: "error", error: msg }));
        onError?.(msg);
      }
    },
    [category, compress, onSuccess, onError]
  );

  return { ...state, upload, reset };
}
