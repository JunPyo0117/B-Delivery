import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

/**
 * Centrifugo Connect Proxy
 * - JWT 검증 → user 정보 반환
 * - 역할별 서버 사이드 채널 구독
 */
const PROXY_SECRET = process.env.CENTRIFUGO_PROXY_SECRET;

export async function POST(request: Request) {
  try {
    if (PROXY_SECRET) {
      const headerSecret = request.headers.get("X-Centrifugo-Proxy-Secret");
      if (headerSecret !== PROXY_SECRET) {
        return NextResponse.json({ error: { code: 403, message: "Forbidden" } });
      }
    }

    const body = await request.json();
    const token = body.token as string;

    if (!token) {
      return NextResponse.json(
        { error: { code: 401, message: "Token required" } },
        { status: 200 }
      );
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub as string;
    const info = payload.info as { role: string; nickname: string } | undefined;
    const role = info?.role || "USER";
    const nickname = info?.nickname || "";

    // 역할별 서버 사이드 채널 구독 (Centrifugo v6: subs 객체)
    const subs: Record<string, object> = { [`user#${userId}`]: {} };

    if (role === "USER") {
      subs[`order#${userId}`] = { recover: true };
    } else if (role === "OWNER") {
      subs[`owner_orders#${userId}`] = { recover: true };
    } else if (role === "RIDER") {
      subs[`delivery_requests#${userId}`] = { recover: true };
    }
    // ADMIN은 user# 채널만 (채팅 알림용)

    return NextResponse.json({
      result: {
        user: userId,
        data: { role, nickname },
        subs,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 401, message: "Invalid token" } },
      { status: 200 }
    );
  }
}
