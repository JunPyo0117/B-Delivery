import Redis from "ioredis";
import { config } from "../config.js";

export const STREAM_KEY = "order_updates_stream";
export const CONSUMER_GROUP = "chat-server-group";
export const CONSUMER_NAME = "chat-server-1";

export const redis = new Redis(config.redisUrl);

export async function ensureStreamGroup(): Promise<void> {
  try {
    await redis.xgroup("CREATE", STREAM_KEY, CONSUMER_GROUP, "0", "MKSTREAM");
    console.log(`Created consumer group: ${CONSUMER_GROUP}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("BUSYGROUP")) {
      console.log(`Consumer group already exists: ${CONSUMER_GROUP}`);
    } else {
      throw err;
    }
  }
}
