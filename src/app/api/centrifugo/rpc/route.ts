import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publish } from "@/lib/centrifugo";
import { redis } from "@/lib/redis";

/**
 * Centrifugo RPC Proxy
 * - typing:start / typing:stop
 * - message:read
 * - location:update (기사 위치)
 * - delivery:accept / delivery:reject
 * - delivery:status (AT_STORE, PICKED_UP, DONE)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.user as string;
    const method = body.method as string;
    const data = body.data as Record<string, unknown>;

    switch (method) {
      case "typing:start":
      case "typing:stop": {
        const chatId = data.chatId as string;
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat) break;

        const recipientId = chat.userId === userId ? chat.adminId : chat.userId;
        if (recipientId) {
          await publish(`user#${recipientId}`, {
            type: "typing:update",
            chatId,
            userId,
            isTyping: method === "typing:start",
          });
        }
        return NextResponse.json({ result: { data: { success: true } } });
      }

      case "message:read": {
        const chatId = data.chatId as string;
        await prisma.message.updateMany({
          where: { chatId, senderId: { not: userId }, isRead: false },
          data: { isRead: true },
        });

        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (chat) {
          const recipientId = chat.userId === userId ? chat.adminId : chat.userId;
          if (recipientId) {
            await publish(`user#${recipientId}`, {
              type: "message:read_receipt",
              chatId,
              userId,
            });
          }
        }
        return NextResponse.json({ result: { data: { success: true } } });
      }

      case "location:update": {
        const lat = data.lat as number;
        const lng = data.lng as number;

        // Redis GEO에 위치 저장
        await redis.geoadd("rider:locations", lng, lat, userId);

        // RiderLocation 테이블 업데이트
        await prisma.riderLocation.upsert({
          where: { userId },
          update: { latitude: lat, longitude: lng, updatedAt: new Date() },
          create: { userId, latitude: lat, longitude: lng, isOnline: true },
        });

        // 현재 진행 중인 배달이 있으면 고객에게 위치 전송
        const activeDelivery = await prisma.delivery.findFirst({
          where: {
            riderId: userId,
            status: { in: ["ACCEPTED", "AT_STORE", "PICKED_UP", "DELIVERING"] },
          },
          include: { order: { select: { userId: true } } },
        });

        if (activeDelivery) {
          const distance = calculateDistance(
            lat, lng,
            activeDelivery.dropoffLat, activeDelivery.dropoffLng
          );
          const rider = await prisma.riderProfile.findUnique({ where: { userId } });
          const speed = getTransportSpeed(rider?.transportType || "MOTORCYCLE");
          const estimatedMinutes = Math.max(1, Math.round((distance / speed) * 60));

          await publish(`rider_location:${activeDelivery.orderId}`, {
            orderId: activeDelivery.orderId,
            riderId: userId,
            lat,
            lng,
            estimatedMinutes,
          });
        }

        return NextResponse.json({ result: { data: { success: true } } });
      }

      case "delivery:accept": {
        const orderId = data.orderId as string;
        // 2단계(기사 에이전트)에서 상세 구현
        return NextResponse.json({ result: { data: { success: true, orderId } } });
      }

      case "delivery:reject": {
        const orderId = data.orderId as string;
        return NextResponse.json({ result: { data: { success: true, orderId } } });
      }

      case "delivery:status": {
        const orderId = data.orderId as string;
        const status = data.status as string;
        // 2단계(기사 에이전트)에서 상세 구현
        return NextResponse.json({ result: { data: { success: true, orderId, status } } });
      }

      default:
        return NextResponse.json({
          error: { code: 400, message: `Unknown RPC method: ${method}` },
        });
    }

    return NextResponse.json({ result: { data: { success: true } } });
  } catch {
    return NextResponse.json({
      error: { code: 500, message: "Internal error" },
    });
  }
}

function calculateDistance(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getTransportSpeed(type: string): number {
  const speeds: Record<string, number> = {
    WALK: 4, BICYCLE: 15, MOTORCYCLE: 30, CAR: 25,
  };
  return speeds[type] || 30;
}
