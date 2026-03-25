/** 이미지 카테고리 (MinIO 폴더 구조) */
export type ImageCategory =
  | "profile"
  | "restaurant"
  | "menu"
  | "review"
  | "chat";

/** Presigned URL 요청 바디 */
export interface PresignedUrlRequest {
  category: ImageCategory;
  contentType: string;
  fileSize: number;
}

/** Presigned URL 응답 */
export interface PresignedUrlResponse {
  /** MinIO에 PUT 요청할 Presigned URL */
  uploadUrl: string;
  /** 저장된 오브젝트 키 (DB 저장용) - e.g. "menu/a1b2c3d4.webp" */
  objectKey: string;
  /** 공개 접근 URL */
  publicUrl: string;
}

/** 업로드 상태 */
export interface UploadState {
  status: "idle" | "compressing" | "uploading" | "done" | "error";
  progress: number;
  objectKey: string | null;
  publicUrl: string | null;
  error: string | null;
}

/** 이미지 압축 옵션 */
export interface ImageCompressOptions {
  maxWidth: number;
  maxHeight: number;
  /** 0~1 */
  quality: number;
}
