import { type Mock, vi } from "vitest";
import { auth } from "@/auth";

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

/**
 * NextAuth v5의 auth는 오버로드(NextMiddleware 포함)가 있어
 * vi.mocked(auth)가 NextMiddleware로 추론됨.
 * 테스트에서는 이 mockedAuth를 사용하여 mockResolvedValue 호출.
 */
export const mockedAuth = auth as unknown as Mock<() => Promise<MockSession | null>>;

export function mockAuth(session: MockSession | null = createMockSession()) {
  return vi.fn().mockResolvedValue(session);
}
