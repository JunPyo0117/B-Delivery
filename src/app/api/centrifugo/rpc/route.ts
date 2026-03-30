import { NextResponse } from "next/server";
import { prisma } from "@/shared/api/prisma";
import { publish } from "@/shared/api/centrifugo";
import { redis } from "@/shared/api/redis";

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
      case "message:send": {
        const chatId = data.chatId as string;
        const type = (data.type as string) || "TEXT";
        const content = data.content as string;

        const chat = await prisma.chat.findFirst({
          where: { id: chatId, OR: [{ userId }, { adminId: userId }] },
        });
        if (!chat) {
          return NextResponse.json({ error: { code: 403, message: "Not a participant" } });
        }

        const message = await prisma.message.create({
          data: { chatId, senderId: userId, type, content },
          include: { sender: { select: { nickname: true } } },
        });

        await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

        const enriched = {
          id: message.id,
          chatId,
          senderId: userId,
          nickname: message.sender.nickname,
          type: message.type,
          content: message.content,
          isRead: false,
          createdAt: message.createdAt.toISOString(),
        };

        // 채팅 채널에 브로드캐스트
        await publish(`chat:${chatId}`, { type: "message:new", ...enriched });

        // 수신자 개인 채널에도 알림
        const recipientId = chat.userId === userId ? chat.adminId : chat.userId;
        if (recipientId) {
          await publish(`user#${recipientId}`, { type: "message:new", ...enriched });
        }

        return NextResponse.json({ result: { data: enriched } });
      }

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

        const activeDelivery = await prisma.delivery.findFirst({
          where: { riderId: userId, status: { notIn: ["DONE", "CANCELLED"] } },
        });
        if (activeDelivery) {
          return NextResponse.json({ error: { code: 400, message: "이미 진행 중인 배달이 있습니다." } });
        }

        const delivery = await prisma.delivery.findUnique({
          where: { orderId },
          include: { order: { select: { userId: true, restaurantId: true, restaurant: { select: { ownerId: true } } } } },
        });
        if (!delivery || delivery.status !== "REQUESTED") {
          return NextResponse.json({ error: { code: 400, message: "수락할 수 없는 배달입니다." } });
        }

        await prisma.$transaction([
          prisma.delivery.update({
            where: { id: delivery.id },
            data: { riderId: userId, status: "ACCEPTED", acceptedAt: new Date() },
          }),
          prisma.order.update({
            where: { id: orderId },
            data: { status: "RIDER_ASSIGNED" },
          }),
        ]);

        const riderProfile = await prisma.user.findUnique({
          where: { id: userId },
          select: { nickname: true, riderProfile: { select: { transportType: true } } },
        });

        const assignedData = {
          orderId,
          riderId: userId,
          riderNickname: riderProfile?.nickname || "",
          transportType: riderProfile?.riderProfile?.transportType || "MOTORCYCLE",
        };

        await publish(`order#${delivery.order.userId}`, { type: "rider_assigned", ...assignedData });
        await publish(`owner_orders#${delivery.order.restaurant.ownerId}`, { type: "rider_assigned", ...assignedData });

        return NextResponse.json({ result: { data: { success: true, orderId } } });
      }

      case "delivery:reject": {
        const orderId = data.orderId as string;
        // 거절은 로깅만 — Order Worker가 타임아웃 시 다른 기사에게 재브로드캐스트
        console.log(`[RPC] delivery:reject by ${userId} for ${orderId}`);
        return NextResponse.json({ result: { data: { success: true, orderId } } });
      }

      case "delivery:status": {
        const orderId = data.orderId as string;
        const newStatus = data.status as string;

        const delivery = await prisma.delivery.findUnique({
          where: { orderId },
          include: { order: { select: { userId: true, restaurant: { select: { ownerId: true } } } } },
        });
        if (!delivery || delivery.riderId !== userId) {
          return NextResponse.json({ error: { code: 403, message: "권한이 없습니다." } });
        }

        const extraData: Record<string, unknown> = {};
        let orderStatus: string | null = null;

        if (newStatus === "AT_STORE") {
          // Order 상태는 변경하지 않음 (RIDER_ASSIGNED 유지)
        } else if (newStatus === "PICKED_UP") {
          extraData.pickedUpAt = new Date();
          orderStatus = "PICKED_UP";
        } else if (newStatus === "DONE") {
          extraData.completedAt = new Date();
          orderStatus = "DONE";
          // 기사 통계 업데이트
          await prisma.riderProfile.update({
            where: { userId },
            data: {
              totalDeliveries: { increment: 1 },
              totalEarnings: { increment: delivery.riderFee },
            },
          });
        }

        const txOps = [
          prisma.delivery.update({
            where: { id: delivery.id },
            data: { status: newStatus as "AT_STORE" | "PICKED_UP" | "DONE", ...extraData },
          }),
        ];
        if (orderStatus) {
          txOps.push(
            prisma.order.update({ where: { id: orderId }, data: { status: orderStatus as "PICKED_UP" | "DONE" } }) as never
          );
        }
        await prisma.$transaction(txOps);

        await publish(`order#${delivery.order.userId}`, { type: "status:changed", orderId, newStatus: orderStatus || newStatus });
        await publish(`owner_orders#${delivery.order.restaurant.ownerId}`, { type: "delivery_status", orderId, newStatus });

        return NextResponse.json({ result: { data: { success: true, orderId, status: newStatus } } });
      }

      default:
        return NextResponse.json({
          error: { code: 400, message: `Unknown RPC method: ${method}` },
        });
    }

    return NextResponse.json({ result: { data: { success: true } } });
  } catch (err) {
    console.error("[RPC Proxy] error:", err);
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
