import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

/**
 * Centrifugo Connect Proxy
 * - JWT 검증 → user 정보 반환
 * - 역할별 서버 사이드 채널 구독
 */
export async function POST(request: Request) {
  try {
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

    // 역할별 서버 사이드 채널 구독
    const channels: string[] = [`user#${userId}`];

    if (role === "USER") {
      channels.push(`order#${userId}`);
    } else if (role === "OWNER") {
      channels.push(`owner_orders#${userId}`);
    } else if (role === "RIDER") {
      channels.push(`delivery_requests#${userId}`);
    }
    // ADMIN은 user# 채널만 (채팅 알림용)

    console.log("[Connect Proxy]", { userId, role, channels });

    return NextResponse.json({
      result: {
        user: userId,
        data: { role, nickname },
        channels,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 401, message: "Invalid token" } },
      { status: 200 }
    );
  }
}
