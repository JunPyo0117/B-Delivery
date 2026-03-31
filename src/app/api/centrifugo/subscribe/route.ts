import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";

/**
 * Centrifugo Subscribe Proxy
 * 화이트리스트 기반 채널 구독 제어
 */

// 허용 채널 패턴
const ALLOWED_PATTERNS = [
  /^chat:.+/,              // 채팅
  /^rider_location:.+/,    // 기사 위치
  /^order#.+/,             // 주문 상태 (서버사이드 구독이지만 방어)
  /^owner_orders#.+/,      // 사장 주문
  /^delivery_requests#.+/, // 배달 요청
  /^user#.+/,              // 개인 채널
];

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
    const userId = body.user as string;
    const channel = body.channel as string;

    // 화이트리스트 패턴 매칭 검사
    const isAllowed = ALLOWED_PATTERNS.some((pattern) => pattern.test(channel));
    if (!isAllowed) {
      return NextResponse.json({
        error: { code: 403, message: "Subscribe not allowed" },
      });
    }

    // chat:<chatId> 채널 — 참여자 검증
    if (channel.startsWith("chat:")) {
      const chatId = channel.replace("chat:", "");
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [{ userId }, { adminId: userId }],
        },
      });

      if (!chat) {
        return NextResponse.json({
          error: { code: 403, message: "Not a chat participant" },
        });
      }

      return NextResponse.json({ result: {} });
    }

    // rider_location:<orderId> 채널 — 주문 관련자 검증
    if (channel.startsWith("rider_location:")) {
      const orderId = channel.replace("rider_location:", "");
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          OR: [
            { userId },
            { restaurant: { ownerId: userId } },
          ],
        },
      });

      if (!order) {
        return NextResponse.json({
          error: { code: 403, message: "Not authorized for this order" },
        });
      }

      return NextResponse.json({ result: {} });
    }

    // # 구분자 채널: 소유자 확인 (order#userId, owner_orders#userId 등)
    if (channel.includes("#")) {
      const channelOwnerId = channel.split("#")[1];
      if (channelOwnerId !== userId) {
        return NextResponse.json({
          error: { code: 403, message: "Not channel owner" },
        });
      }
    }

    return NextResponse.json({ result: {} });
  } catch {
    return NextResponse.json({
      error: { code: 500, message: "Internal error" },
    });
  }
}
