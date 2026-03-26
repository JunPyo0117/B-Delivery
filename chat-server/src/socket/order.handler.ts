import { Namespace, Socket } from "socket.io";
import { verifyToken } from "../auth/jwt.js";

export function registerOrderHandlers(nsp: Namespace): void {
  // 인증 미들웨어
  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) return next(new Error("Missing token"));
      const payload = await verifyToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  nsp.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    console.log(`[Order] Connected: ${userId} (${socket.id})`);

    // 개인 Room에 자동 입장
    socket.join(`user:${userId}`);

    socket.on("disconnect", () => {
      console.log(`[Order] Disconnected: ${userId} (${socket.id})`);
    });
  });
}
