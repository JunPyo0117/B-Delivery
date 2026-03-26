import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config.js";
import { ensureStreamGroup } from "./lib/redis.js";
import { registerChatHandlers } from "./socket/chat.handler.js";
import { registerOrderHandlers } from "./socket/order.handler.js";
import { startStreamConsumer } from "./stream/consumer.js";

async function main() {
  // Redis Stream consumer group 생성
  await ensureStreamGroup();

  // HTTP 서버 + Socket.IO
  const httpServer = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // 네임스페이스 등록
  const chatNsp = io.of("/chat");
  registerChatHandlers(chatNsp);

  const orderNsp = io.of("/order");
  registerOrderHandlers(orderNsp);

  // Redis Stream consumer 시작
  const abortController = new AbortController();
  startStreamConsumer(orderNsp, abortController.signal);

  // 서버 시작
  httpServer.listen(config.port, () => {
    console.log(`Chat server starting on :${config.port}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down...");
    abortController.abort();
    io.close();
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
