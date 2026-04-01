import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    setupFiles: ["src/__tests__/helpers/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/entities/*/api/**",
        "src/entities/*/model/**",
        "src/features/*/api/**",
        "src/features/*/model/**",
        "src/app/api/**",
        "src/shared/lib/**",
      ],
      exclude: [
        // 타입 정의만 있는 파일
        "src/**/model/types.ts",
        "src/shared/lib/index.ts",
        // 브라우저/외부 SDK 의존 (Node 환경 테스트 부적합)
        "src/shared/lib/use-geolocation.ts",
        "src/shared/lib/use-kakao-loader.ts",
        "src/shared/lib/use-search.ts",
        "src/shared/lib/kakao.ts",
        "src/shared/lib/image-compress.ts",
        "src/shared/lib/useImageUpload.ts",
        // Centrifugo WebSocket 클라이언트 훅
        "src/features/*/model/useCentrifugo*.ts",
        // React 클라이언트 훅
        "src/features/menu-option/model/useMenuOption.ts",
        // 빈 파일
        "src/app/api/.gitkeep",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
