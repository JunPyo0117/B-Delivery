/**
 * Order Worker
 * Redis Stream을 구독하여 Centrifugo Server API로 발행하는 경량 워커.
 *
 * Streams:
 * - order_updates_stream → order#<userId> 채널 (주문 상태 변경)
 * - delivery_requests_stream → GEORADIUS로 근처 기사 검색 → delivery_requests#<riderId> 발행
 */

try { await import("dotenv/config"); } catch {}
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CENTRIFUGO_API_URL = process.env.CENTRIFUGO_API_URL || "http://localhost:8080/api";
const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY || "";

const ORDER_STREAM = "order_updates_stream";
const DELIVERY_STREAM = "delivery_requests_stream";
const CONSUMER_GROUP = "order-worker-group";
const CONSUMER_NAME = "order-worker-1";

const redisOrder = new Redis(REDIS_URL);
const redisDelivery = new Redis(REDIS_URL);
const redis = new Redis(REDIS_URL); // 공용 (GEORADIUS, XACK 등)

async function centrifugoPublish(channel: string, data: unknown) {
  const res = await fetch(`${CENTRIFUGO_API_URL}/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": CENTRIFUGO_API_KEY,
    },
    body: JSON.stringify({ channel, data }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Centrifugo publish failed: ${res.status} ${body}`);
  }
}

async function ensureConsumerGroups() {
  for (const stream of [ORDER_STREAM, DELIVERY_STREAM]) {
    try {
      await redis.xgroup("CREATE", stream, CONSUMER_GROUP, "0", "MKSTREAM");
    } catch {
      // 그룹 이미 존재
    }
  }
}

function parseStreamFields(fields: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) {
    result[fields[i]] = fields[i + 1];
  }
  return result;
}

async function processOrderUpdates() {
  const results = await redisOrder.xreadgroup(
    "GROUP", CONSUMER_GROUP, CONSUMER_NAME,
    "COUNT", "10",
    "BLOCK", "5000",
    "STREAMS", ORDER_STREAM, ">"
  ) as [string, [string, string[]][]][] | null;

  if (!results) return;

  for (const [, messages] of results) {
    for (const [id, fields] of messages) {
      const data = parseStreamFields(fields);
      const { orderId, newStatus, userId, timestamp, ownerId } = data;

      if (!orderId || !userId) {
        await redis.xack(ORDER_STREAM, CONSUMER_GROUP, id);
        continue;
      }

      // 고객에게 주문 상태 변경 발행
      await centrifugoPublish(`order#${userId}`, {
        orderId, newStatus, userId, timestamp,
      });

      // 사장에게 주문 상태 변경 발행
      if (ownerId) {
        await centrifugoPublish(`owner_orders#${ownerId}`, {
          orderId, newStatus, userId, timestamp,
        });
        console.log(`[ORDER] ${orderId} → ${newStatus} → owner_orders#${ownerId}`);
      }

      await redis.xack(ORDER_STREAM, CONSUMER_GROUP, id);
      console.log(`[ORDER] ${orderId} → ${newStatus} → order#${userId}`);
    }
  }
}

async function processDeliveryRequests() {
  const results = await redisDelivery.xreadgroup(
    "GROUP", CONSUMER_GROUP, CONSUMER_NAME,
    "COUNT", "10",
    "BLOCK", "5000",
    "STREAMS", DELIVERY_STREAM, ">"
  ) as [string, [string, string[]][]][] | null;

  if (!results) return;

  for (const [, messages] of results) {
    for (const [id, fields] of messages) {
      const data = parseStreamFields(fields);
      const { orderId, pickupLat, pickupLng, restaurantName, riderFee } = data;

      if (!orderId) {
        await redis.xack(DELIVERY_STREAM, CONSUMER_GROUP, id);
        continue;
      }

      // 가게 반경 3km 내 온라인 기사 검색
      const nearbyRiders = await redis.georadius(
        "rider:locations",
        Number(pickupLng), Number(pickupLat),
        3, "km"
      );

      for (const riderId of nearbyRiders) {
        await centrifugoPublish(`delivery_requests#${riderId}`, {
          orderId,
          restaurantName,
          pickupLat: Number(pickupLat),
          pickupLng: Number(pickupLng),
          dropoffLat: Number(data.dropoffLat),
          dropoffLng: Number(data.dropoffLng),
          riderFee: Number(riderFee),
        });
        console.log(`[DELIVERY] ${orderId} → delivery_requests#${riderId}`);
      }

      if (nearbyRiders.length === 0) {
        console.log(`[DELIVERY] ${orderId} → 근처 기사 없음`);
      }

      await redis.xack(DELIVERY_STREAM, CONSUMER_GROUP, id);
    }
  }
}

async function main() {
  console.log("Order Worker started");
  await ensureConsumerGroups();

  const controller = new AbortController();
  process.on("SIGINT", () => controller.abort());
  process.on("SIGTERM", () => controller.abort());

  while (!controller.signal.aborted) {
    try {
      await Promise.all([
        processOrderUpdates(),
        processDeliveryRequests(),
      ]);
    } catch (err) {
      if (controller.signal.aborted) break;
      console.error("Worker error:", err);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log("Order Worker stopped");
  redisOrder.disconnect();
  redisDelivery.disconnect();
  redis.disconnect();
}

main();
