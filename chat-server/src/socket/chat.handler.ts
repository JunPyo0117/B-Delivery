import { Namespace, Socket } from "socket.io";
import { randomUUID } from "crypto";
import { verifyToken } from "../auth/jwt.js";
import * as chatService from "../services/chat.service.js";

// userId → Set<socketId>
const userSockets = new Map<string, Set<string>>();

export function registerChatHandlers(nsp: Namespace): void {
  // 인증 미들웨어
  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) return next(new Error("Missing token"));
      const payload = await verifyToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      socket.data.nickname = payload.nickname;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  nsp.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    console.log(`[Chat] Connected: ${userId} (${socket.id})`);

    // 사용자별 소켓 관리
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // 개인 Room 자동 입장 (다중 디바이스 메시지 전달용)
    socket.join(`user:${userId}`);

    // room:join - 채팅방 입장
    socket.on("room:join", async (data: { chatId: string }) => {
      try {
        const participants = await chatService.getChatParticipants(data.chatId);
        if (userId !== participants.customerId && userId !== participants.ownerId) {
          socket.emit("error", { message: "Not a participant" });
          return;
        }
        socket.join(`chat:${data.chatId}`);

        // 입장 시 읽음 처리
        const count = await chatService.markMessagesAsRead(data.chatId, userId);
        if (count > 0) {
          const recipientId = userId === participants.ownerId
            ? participants.customerId
            : participants.ownerId;
          nsp.to(`user:${recipientId}`).emit("message:read_receipt", {
            chatId: data.chatId,
            userId,
          });
        }
      } catch (err) {
        console.error("[Chat] room:join error:", err);
      }
    });

    // message:send - 메시지 전송 (ack 콜백 포함)
    socket.on(
      "message:send",
      async (
        data: { chatId: string; type: string; content: string },
        callback?: (ack: { id: string; createdAt: string }) => void
      ) => {
        try {
          if (!data.chatId || !data.content) return;
          const type = data.type || "TEXT";

          const participants = await chatService.getChatParticipants(data.chatId);
          if (userId !== participants.customerId && userId !== participants.ownerId) {
            return;
          }

          const msgId = randomUUID();
          const createdAt = await chatService.saveMessage(
            msgId, data.chatId, userId, type, data.content
          );
          await chatService.updateChatTimestamp(data.chatId);

          const response = {
            id: msgId,
            chatId: data.chatId,
            senderId: userId,
            nickname: socket.data.nickname as string,
            type,
            content: data.content,
            isRead: false,
            createdAt,
          };

          // Room 내 상대방에게 브로드캐스트 (발신자 제외)
          socket.to(`chat:${data.chatId}`).emit("message:new", response);

          // 발신자의 다른 디바이스에도 전달
          socket.to(`user:${userId}`).emit("message:new", response);

          // 수신자의 user room에도 전달 (채팅 목록 실시간 업데이트용)
          const recipientId = userId === participants.ownerId
            ? participants.customerId
            : participants.ownerId;
          nsp.to(`user:${recipientId}`).emit("message:new", response);

          // ack 콜백 반환
          if (callback) {
            callback({ id: msgId, createdAt });
          }
        } catch (err) {
          console.error("[Chat] message:send error:", err);
        }
      }
    );

    // typing:start
    socket.on("typing:start", async (data: { chatId: string }) => {
      try {
        const participants = await chatService.getChatParticipants(data.chatId);
        const recipientId = userId === participants.ownerId
          ? participants.customerId
          : participants.ownerId;
        nsp.to(`user:${recipientId}`).emit("typing:update", {
          chatId: data.chatId,
          userId,
          isTyping: true,
        });
      } catch {}
    });

    // typing:stop
    socket.on("typing:stop", async (data: { chatId: string }) => {
      try {
        const participants = await chatService.getChatParticipants(data.chatId);
        const recipientId = userId === participants.ownerId
          ? participants.customerId
          : participants.ownerId;
        nsp.to(`user:${recipientId}`).emit("typing:update", {
          chatId: data.chatId,
          userId,
          isTyping: false,
        });
      } catch {}
    });

    // message:read - 읽음 처리
    socket.on("message:read", async (data: { chatId: string }) => {
      try {
        const count = await chatService.markMessagesAsRead(data.chatId, userId);
        if (count === 0) return;

        const participants = await chatService.getChatParticipants(data.chatId);
        const recipientId = userId === participants.ownerId
          ? participants.customerId
          : participants.ownerId;
        nsp.to(`user:${recipientId}`).emit("message:read_receipt", {
          chatId: data.chatId,
          userId,
        });
      } catch (err) {
        console.error("[Chat] message:read error:", err);
      }
    });

    // disconnect
    socket.on("disconnect", () => {
      console.log(`[Chat] Disconnected: ${userId} (${socket.id})`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
    });
  });
}

// 외부에서 사용 (stream consumer에서 호출)
export function getChatNamespace(): Namespace | null {
  return null; // index.ts에서 실제 namespace 참조를 주입
}
