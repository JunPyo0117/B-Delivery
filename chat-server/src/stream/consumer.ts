import { Namespace } from "socket.io";
import { redis, STREAM_KEY, CONSUMER_GROUP, CONSUMER_NAME } from "../lib/redis.js";

export function startStreamConsumer(
  orderNsp: Namespace,
  signal: AbortSignal
): void {
  const consume = async () => {
    while (!signal.aborted) {
      try {
        const results = await redis.xreadgroup(
          "GROUP", CONSUMER_GROUP, CONSUMER_NAME,
          "COUNT", "10",
          "BLOCK", "5000",
          "STREAMS", STREAM_KEY, ">"
        );

        if (!results) continue;

        for (const [, messages] of results as [string, [string, string[]][]][]) {
          for (const [msgId, fields] of messages) {
            const data: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
              data[fields[i]] = fields[i + 1];
            }

            const { orderId, newStatus, userId, timestamp } = data;
            if (!orderId || !userId) {
              await redis.xack(STREAM_KEY, CONSUMER_GROUP, msgId);
              continue;
            }

            // /order 네임스페이스의 해당 사용자 Room으로 이벤트 전송
            orderNsp.to(`user:${userId}`).emit("status:changed", {
              orderId,
              newStatus,
              userId,
              timestamp,
            });

            console.log(`[Stream] Order update: ${orderId} → ${newStatus} (user: ${userId})`);
            await redis.xack(STREAM_KEY, CONSUMER_GROUP, msgId);
          }
        }
      } catch (err) {
        if (signal.aborted) break;
        console.error("[Stream] Error:", err);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    console.log("[Stream] Consumer stopped.");
  };

  consume();
}
