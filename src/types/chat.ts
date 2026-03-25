// WebSocket 메시지 봉투 (Go models/types.go와 매핑)
export interface WSMessage {
  type: string;
  payload: unknown;
}

// ─── 클라이언트 → 서버 ────────────────────────────────

export interface ChatMessagePayload {
  chatId: string;
  type: "TEXT" | "IMAGE";
  content: string;
}

export interface TypingPayload {
  chatId: string;
  isTyping: boolean;
}

export interface ReadPayload {
  chatId: string;
}

// ─── 서버 → 클라이언트 ────────────────────────────────

export interface ChatMessageResponse {
  id: string;
  chatId: string;
  senderId: string;
  nickname: string;
  type: "TEXT" | "IMAGE";
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageAck {
  id: string;
  createdAt: string;
}

export interface TypingEvent {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export interface ReadReceiptEvent {
  chatId: string;
  userId: string;
}

// ─── UI 전용 타입 ────────────────────────────────────

/** optimistic 메시지 (서버 확인 전) */
export interface PendingMessage extends ChatMessageResponse {
  _pending?: boolean;
  _tempId?: string;
}

/** 채팅 진입 페이지 - 주문 카드 */
export interface ChatOrderItem {
  orderId: string;
  restaurantName: string;
  restaurantImageUrl: string | null;
  itemSummary: string;
  totalPrice: number;
  createdAt: string;
  chatId: string | null;
}
