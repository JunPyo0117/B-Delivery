import Redis from "ioredis";

const STREAM_KEY = "order_updates_stream";

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
 * Go 채팅 서버가 XREADGROUP으로 소비하여 WebSocket 푸시합니다.
 */
export async function publishOrderUpdate(
  orderId: string,
  newStatus: string,
  userId: string
) {
  await redis.xadd(
    STREAM_KEY,
    "*",
    "orderId",
    orderId,
    "newStatus",
    newStatus,
    "userId",
    userId,
    "timestamp",
    new Date().toISOString()
  );
}
