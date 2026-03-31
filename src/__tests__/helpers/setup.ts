import { vi } from "vitest";
import { prismaMock } from "./prisma-mock";
import { redisMock } from "./redis-mock";

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
