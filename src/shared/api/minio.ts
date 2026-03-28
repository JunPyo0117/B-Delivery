import { Client } from "minio";

const globalForMinio = globalThis as unknown as {
  minioClient: Client | undefined;
};

function createMinioClient(): Client {
  return new Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: parseInt(process.env.MINIO_PORT!, 10),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
}

/** Lazy 초기화 — 빌드 타임에 환경변수가 없어도 안전 */
export function getMinioClient(): Client {
  if (!globalForMinio.minioClient) {
    globalForMinio.minioClient = createMinioClient();
  }
  return globalForMinio.minioClient;
}

export const MINIO_BUCKET = process.env.MINIO_BUCKET_NAME ?? "bdelivery";

/**
 * MinIO 오브젝트의 공개 접근 URL 생성
 * 클라이언트(브라우저)가 접근 가능한 URL을 반환
 */
export function getPublicUrl(objectKey: string): string {
  const endpoint =
    process.env.NEXT_PUBLIC_MINIO_ENDPOINT ??
    process.env.MINIO_ENDPOINT ??
    "localhost";
  const port =
    process.env.NEXT_PUBLIC_MINIO_PORT ?? process.env.MINIO_PORT ?? "9000";
  return `http://${endpoint}:${port}/${MINIO_BUCKET}/${objectKey}`;
}

/**
 * Presigned URL의 호스트를 클라이언트 접근 가능한 주소로 치환
 * Docker 내부에서는 minio:9000이지만, 브라우저는 localhost:9000으로 접근해야 함
 */
export function toPublicPresignedUrl(presignedUrl: string): string {
  const internalEndpoint = process.env.MINIO_ENDPOINT ?? "localhost";
  const internalPort = process.env.MINIO_PORT ?? "9000";
  const publicEndpoint =
    process.env.NEXT_PUBLIC_MINIO_ENDPOINT ?? "localhost";
  const publicPort =
    process.env.NEXT_PUBLIC_MINIO_PORT ?? "9000";

  return presignedUrl.replace(
    `http://${internalEndpoint}:${internalPort}`,
    `http://${publicEndpoint}:${publicPort}`
  );
}
