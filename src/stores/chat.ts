import { create } from "zustand";
import type {
  ChatMessageResponse,
  PendingMessage,
} from "@/types/chat";

interface ChatState {
  /** chatId → 메시지 배열 */
  messages: Record<string, PendingMessage[]>;
  /** chatId → 타이핑 중인 userId 목록 */
  typingUsers: Record<string, string[]>;
  /** 이전 메시지 더 있는지 여부 */
  hasMore: Record<string, boolean>;

  // 액션
  setMessages: (chatId: string, messages: ChatMessageResponse[]) => void;
  prependMessages: (chatId: string, messages: ChatMessageResponse[]) => void;
  addMessage: (chatId: string, message: PendingMessage) => void;
  confirmMessage: (tempId: string, ack: { id: string; createdAt: string }) => void;
  markAsRead: (chatId: string) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setHasMore: (chatId: string, hasMore: boolean) => void;
  clearChat: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  typingUsers: {},
  hasMore: {},

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  prependMessages: (chatId, older) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...older, ...(state.messages[chatId] ?? [])],
      },
    })),

  addMessage: (chatId, message) =>
    set((state) => {
      const existing = state.messages[chatId] ?? [];
      // 중복 메시지 방지 (같은 id가 이미 있으면 무시)
      if (message.id && existing.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [chatId]: [...existing, message],
        },
      };
    }),

  confirmMessage: (tempId, ack) =>
    set((state) => {
      const updated = { ...state.messages };
      for (const chatId of Object.keys(updated)) {
        updated[chatId] = updated[chatId].map((m) =>
          m._tempId === tempId
            ? { ...m, id: ack.id, createdAt: ack.createdAt, _pending: false, _tempId: undefined }
            : m
        );
      }
      return { messages: updated };
    }),

  markAsRead: (chatId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] ?? []).map((m) => ({ ...m, isRead: true })),
      },
    })),

  setTyping: (chatId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[chatId] ?? [];
      const next = isTyping
        ? current.includes(userId) ? current : [...current, userId]
        : current.filter((id) => id !== userId);
      return { typingUsers: { ...state.typingUsers, [chatId]: next } };
    }),

  setHasMore: (chatId, hasMore) =>
    set((state) => ({
      hasMore: { ...state.hasMore, [chatId]: hasMore },
    })),

  clearChat: (chatId) =>
    set((state) => {
      const { [chatId]: _msgs, ...restMessages } = state.messages;
      const { [chatId]: _typing, ...restTyping } = state.typingUsers;
      const { [chatId]: _more, ...restHasMore } = state.hasMore;
      return { messages: restMessages, typingUsers: restTyping, hasMore: restHasMore };
    }),
}));
