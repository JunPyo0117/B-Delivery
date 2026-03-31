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
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
