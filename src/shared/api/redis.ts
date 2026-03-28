import Redis from "ioredis";

const ORDER_STREAM = "order_updates_stream";
const DELIVERY_STREAM = "delivery_requests_stream";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient() {
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Redis Stream에 주문 상태 변경 이벤트를 발행합니다.
 * Order Worker가 XREADGROUP으로 소비하여 Centrifugo에 발행합니다.
 */
export async function publishOrderUpdate(
  orderId: string,
  newStatus: string,
  userId: string
) {
  await redis.xadd(
    ORDER_STREAM,
    "*",
    "orderId", orderId,
    "newStatus", newStatus,
    "userId", userId,
    "timestamp", new Date().toISOString()
  );
}

/**
 * Redis Stream에 배달 요청 이벤트를 발행합니다.
 * Order Worker가 소비하여 근처 기사에게 브로드캐스트합니다.
 */
export async function publishDeliveryRequest(
  orderId: string,
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  restaurantName: string,
  riderFee: number
) {
  await redis.xadd(
    DELIVERY_STREAM,
    "*",
    "orderId", orderId,
    "pickupLat", String(pickupLat),
    "pickupLng", String(pickupLng),
    "dropoffLat", String(dropoffLat),
    "dropoffLng", String(dropoffLng),
    "restaurantName", restaurantName,
    "riderFee", String(riderFee),
    "timestamp", new Date().toISOString()
  );
}
