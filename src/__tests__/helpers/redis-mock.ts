import { vi } from "vitest";

export const redisMock = {
  geoadd: vi.fn().mockResolvedValue(1),
  georadius: vi.fn().mockResolvedValue([]),
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue("OK"),
  setex: vi.fn().mockResolvedValue("OK"),
  del: vi.fn().mockResolvedValue(1),
  xadd: vi.fn().mockResolvedValue("1-0"),
  expire: vi.fn().mockResolvedValue(1),
};

export function resetRedisMock() {
  Object.values(redisMock).forEach((fn) => fn.mockClear());
}
