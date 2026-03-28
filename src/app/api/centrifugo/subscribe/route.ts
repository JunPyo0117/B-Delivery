import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Centrifugo Subscribe Proxy
 * - chat:<chatId> → 채팅 참여자 검증
 * - rider_location:<orderId> → 해당 주문의 고객/사장 검증
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.user as string;
    const channel = body.channel as string;

    // chat:<chatId> 채널
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

    // rider_location:<orderId> 채널
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

    // 기타 채널은 허용
    return NextResponse.json({ result: {} });
  } catch {
    return NextResponse.json({
      error: { code: 500, message: "Internal error" },
    });
  }
}
