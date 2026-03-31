import { vi } from "vitest";

export interface MockUser {
  id: string;
  role: "USER" | "OWNER" | "RIDER" | "ADMIN";
  email: string;
  nickname: string;
}

export interface MockSession {
  user: MockUser;
  expires: string;
}

export function createMockSession(overrides?: Partial<MockUser>): MockSession {
  return {
    user: {
      id: "user-1",
      role: "USER",
      email: "test@example.com",
      nickname: "테스트유저",
      ...overrides,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

export function mockAuth(session: MockSession | null = createMockSession()) {
  return vi.fn().mockResolvedValue(session);
}
