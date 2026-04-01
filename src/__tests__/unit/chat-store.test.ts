import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "@/features/chat/model/chatStore";
import type { ChatMessageResponse, PendingMessage } from "@/types/chat";

function makeMessage(
  overrides?: Partial<ChatMessageResponse>
): ChatMessageResponse {
  return {
    id: "msg-1",
    chatId: "chat-1",
    senderId: "sender-1",
    nickname: "테스트유저",
    type: "TEXT",
    content: "안녕하세요",
    isRead: false,
    createdAt: "2026-03-31T10:00:00.000Z",
    ...overrides,
  };
}

function makePending(
  overrides?: Partial<PendingMessage>
): PendingMessage {
  return {
    ...makeMessage(),
    _pending: true,
    _tempId: "temp-1",
    ...overrides,
  };
}

beforeEach(() => {
  useChatStore.setState({
    messages: {},
    typingUsers: {},
    hasMore: {},
  });
});

describe("setMessages", () => {
  it("채팅방에 메시지 배열을 설정한다", () => {
    const msgs = [makeMessage({ id: "msg-1" }), makeMessage({ id: "msg-2" })];
    useChatStore.getState().setMessages("chat-1", msgs);

    const { messages } = useChatStore.getState();
    expect(messages["chat-1"]).toHaveLength(2);
  });

  it("기존 메시지를 덮어쓴다", () => {
    useChatStore.getState().setMessages("chat-1", [makeMessage({ id: "old" })]);
    useChatStore.getState().setMessages("chat-1", [makeMessage({ id: "new" })]);

    const { messages } = useChatStore.getState();
    expect(messages["chat-1"]).toHaveLength(1);
    expect(messages["chat-1"][0].id).toBe("new");
  });

  it("다른 채팅방 메시지에 영향을 주지 않는다", () => {
    useChatStore.getState().setMessages("chat-1", [makeMessage({ id: "m1" })]);
    useChatStore.getState().setMessages("chat-2", [makeMessage({ id: "m2" })]);

    const { messages } = useChatStore.getState();
    expect(messages["chat-1"]).toHaveLength(1);
    expect(messages["chat-2"]).toHaveLength(1);
  });
});

describe("prependMessages", () => {
  it("기존 메시지 앞에 이전 메시지를 추가한다", () => {
    useChatStore.getState().setMessages("chat-1", [makeMessage({ id: "new" })]);
    useChatStore
      .getState()
      .prependMessages("chat-1", [makeMessage({ id: "old" })]);

    const msgs = useChatStore.getState().messages["chat-1"];
    expect(msgs).toHaveLength(2);
    expect(msgs[0].id).toBe("old");
    expect(msgs[1].id).toBe("new");
  });

  it("메시지가 없는 채팅방에 prepend하면 해당 메시지만 들어간다", () => {
    useChatStore
      .getState()
      .prependMessages("chat-x", [makeMessage({ id: "first" })]);

    const msgs = useChatStore.getState().messages["chat-x"];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe("first");
  });
});

describe("addMessage", () => {
  it("메시지를 뒤에 추가한다", () => {
    useChatStore.getState().setMessages("chat-1", [makeMessage({ id: "m1" })]);
    useChatStore.getState().addMessage("chat-1", makePending({ id: "m2" }));

    const msgs = useChatStore.getState().messages["chat-1"];
    expect(msgs).toHaveLength(2);
    expect(msgs[1].id).toBe("m2");
  });

  it("같은 id의 메시지가 이미 있으면 중복 추가하지 않는다", () => {
    useChatStore.getState().setMessages("chat-1", [makeMessage({ id: "m1" })]);
    useChatStore.getState().addMessage("chat-1", makePending({ id: "m1" }));

    const msgs = useChatStore.getState().messages["chat-1"];
    expect(msgs).toHaveLength(1);
  });

  it("메시지가 없는 채팅방에 추가하면 새 배열을 생성한다", () => {
    useChatStore
      .getState()
      .addMessage("chat-new", makePending({ id: "first" }));

    const msgs = useChatStore.getState().messages["chat-new"];
    expect(msgs).toHaveLength(1);
  });
});

describe("confirmMessage", () => {
  it("임시 메시지를 확인된 메시지로 교체한다", () => {
    const pending = makePending({ id: "", _tempId: "temp-1", _pending: true });
    useChatStore.getState().setMessages("chat-1", [pending]);

    useChatStore.getState().confirmMessage("temp-1", {
      id: "real-1",
      createdAt: "2026-03-31T10:01:00.000Z",
    });

    const msgs = useChatStore.getState().messages["chat-1"];
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe("real-1");
    expect(msgs[0].createdAt).toBe("2026-03-31T10:01:00.000Z");
    expect(msgs[0]._pending).toBe(false);
    expect(msgs[0]._tempId).toBeUndefined();
  });

  it("message:new가 먼저 도착한 중복을 제거한다", () => {
    // ack보다 message:new가 먼저 도착: 같은 id이지만 다른 _tempId
    const pending = makePending({ id: "", _tempId: "temp-1" });
    const serverMsg = makeMessage({ id: "real-1" });
    useChatStore.getState().setMessages("chat-1", [pending, serverMsg]);

    useChatStore.getState().confirmMessage("temp-1", {
      id: "real-1",
      createdAt: "2026-03-31T10:01:00.000Z",
    });

    const msgs = useChatStore.getState().messages["chat-1"];
    // 중복 제거: temp 메시지만 남고 confirm됨
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe("real-1");
  });
});

describe("markAsRead", () => {
  it("채팅방의 모든 메시지를 읽음 처리한다", () => {
    useChatStore.getState().setMessages("chat-1", [
      makeMessage({ id: "m1", isRead: false }),
      makeMessage({ id: "m2", isRead: false }),
    ]);

    useChatStore.getState().markAsRead("chat-1");

    const msgs = useChatStore.getState().messages["chat-1"];
    expect(msgs.every((m) => m.isRead)).toBe(true);
  });

  it("메시지가 없는 채팅방에 호출해도 에러가 발생하지 않는다", () => {
    expect(() =>
      useChatStore.getState().markAsRead("chat-nonexistent")
    ).not.toThrow();
  });
});

describe("setTyping", () => {
  it("타이핑 시작 시 userId를 추가한다", () => {
    useChatStore.getState().setTyping("chat-1", "user-2", true);

    const typing = useChatStore.getState().typingUsers["chat-1"];
    expect(typing).toContain("user-2");
  });

  it("타이핑 중복 추가를 방지한다", () => {
    useChatStore.getState().setTyping("chat-1", "user-2", true);
    useChatStore.getState().setTyping("chat-1", "user-2", true);

    const typing = useChatStore.getState().typingUsers["chat-1"];
    expect(typing).toHaveLength(1);
  });

  it("타이핑 종료 시 userId를 제거한다", () => {
    useChatStore.getState().setTyping("chat-1", "user-2", true);
    useChatStore.getState().setTyping("chat-1", "user-2", false);

    const typing = useChatStore.getState().typingUsers["chat-1"];
    expect(typing).toHaveLength(0);
  });

  it("여러 사용자의 타이핑을 관리한다", () => {
    useChatStore.getState().setTyping("chat-1", "user-a", true);
    useChatStore.getState().setTyping("chat-1", "user-b", true);

    const typing = useChatStore.getState().typingUsers["chat-1"];
    expect(typing).toHaveLength(2);
    expect(typing).toContain("user-a");
    expect(typing).toContain("user-b");
  });
});

describe("setHasMore", () => {
  it("hasMore를 설정한다", () => {
    useChatStore.getState().setHasMore("chat-1", true);
    expect(useChatStore.getState().hasMore["chat-1"]).toBe(true);

    useChatStore.getState().setHasMore("chat-1", false);
    expect(useChatStore.getState().hasMore["chat-1"]).toBe(false);
  });
});

describe("clearChat", () => {
  it("채팅방의 모든 데이터를 제거한다", () => {
    useChatStore.getState().setMessages("chat-1", [makeMessage()]);
    useChatStore.getState().setTyping("chat-1", "user-2", true);
    useChatStore.getState().setHasMore("chat-1", true);

    useChatStore.getState().clearChat("chat-1");

    const state = useChatStore.getState();
    expect(state.messages["chat-1"]).toBeUndefined();
    expect(state.typingUsers["chat-1"]).toBeUndefined();
    expect(state.hasMore["chat-1"]).toBeUndefined();
  });

  it("다른 채팅방에 영향을 주지 않는다", () => {
    useChatStore.getState().setMessages("chat-1", [makeMessage()]);
    useChatStore.getState().setMessages("chat-2", [makeMessage({ id: "m2" })]);

    useChatStore.getState().clearChat("chat-1");

    const state = useChatStore.getState();
    expect(state.messages["chat-1"]).toBeUndefined();
    expect(state.messages["chat-2"]).toHaveLength(1);
  });
});
