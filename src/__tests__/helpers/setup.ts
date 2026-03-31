import { vi } from "vitest";
import { prismaMock } from "./prisma-mock";
import { redisMock } from "./redis-mock";

// Centrifugo Proxy Secret 환경변수 (모듈 import 전에 설정)
process.env.CENTRIFUGO_PROXY_SECRET = "test-secret";

// Prisma 싱글톤 mock
vi.mock("@/shared/api/prisma", () => ({
  prisma: prismaMock,
}));

// Redis mock
vi.mock("@/shared/api/redis", () => ({
  redis: redisMock,
  publishOrderUpdate: vi.fn().mockResolvedValue(undefined),
  publishDeliveryRequest: vi.fn().mockResolvedValue(undefined),
}));

// Centrifugo publish mock
vi.mock("@/shared/api/centrifugo", () => ({
  publish: vi.fn().mockResolvedValue(undefined),
}));
