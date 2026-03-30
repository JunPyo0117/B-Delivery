# Bug Report: 채팅 기능 E2E 테스트

- **발견일**: 2026-03-26
- **심각도**: Critical
- **상태**: 해결 완료 (3건)

## 증상

채팅 목록에서 주문을 선택하여 채팅방(`/chat/[chatId]`)에 진입하면 즉시 에러 발생:

```
Console Error:
The result of getSnapshot should be cached to avoid an infinite loop
```

페이지가 무한 루프에 빠져 렌더링되지 않고, Next.js 에러 오버레이가 표시됨.

## 발생 원인

`MessageList.tsx`에서 Zustand 스토어 selector가 매 호출마다 **새로운 빈 배열**을 반환하여 React의 `useSyncExternalStore` 무한 루프를 유발.

```tsx
// 문제 코드 — selector 안에서 ?? [] 사용
const messages = useChatStore((s) => s.messages[chatId] ?? []);
const typingUsers = useChatStore((s) => s.typingUsers[chatId] ?? []);
```

### 왜 무한 루프가 발생하는가

1. `s.messages[chatId]`가 `undefined`인 경우 (채팅방 진입 직후, 메시지 로드 전)
2. `?? []`가 매번 **새로운 빈 배열 객체**를 생성
3. Zustand의 `useSyncExternalStore`가 이전 snapshot과 비교 → 참조가 다름 → 리렌더링
4. 리렌더링 시 또 다시 새 빈 배열 생성 → 무한 반복

## 해결 방법

모듈 레벨 상수를 정의하고, `?? []`를 selector **밖**으로 이동하여 동일한 참조를 유지.

### 수정 파일

`src/app/(customer)/chat/[chatId]/_components/MessageList.tsx`

```diff
+ const EMPTY_MESSAGES: PendingMessage[] = [];
+ const EMPTY_TYPING: string[] = [];

  export function MessageList({ chatId, currentUserId }: MessageListProps) {
-   const messages = useChatStore((s) => s.messages[chatId] ?? []);
-   const typingUsers = useChatStore((s) => s.typingUsers[chatId] ?? []);
+   const messages = useChatStore((s) => s.messages[chatId]) ?? EMPTY_MESSAGES;
+   const typingUsers = useChatStore((s) => s.typingUsers[chatId]) ?? EMPTY_TYPING;
```

### 동작 원리

- `s.messages[chatId]`가 `undefined`를 반환 → selector의 반환값은 항상 `undefined` (안정적)
- `?? EMPTY_MESSAGES`는 selector 밖에서 적용 → 모듈 레벨 상수로 참조 동일
- React가 snapshot 비교 시 같은 참조 → 불필요한 리렌더링 없음

## 검증

Playwright E2E 테스트로 검증:
1. 채팅 목록 → 주문 선택 → 채팅방 진입: 에러 없이 정상 렌더링
2. 텍스트 메시지 전송: WebSocket → Go 서버 → DB 저장 → UI 반영 정상
3. 연속 메시지 전송: 날짜 구분선, 시간 표시, 읽음 표시 정상

## 영향 범위

| 영향 | 설명 |
|------|------|
| 채팅방 진입 불가 | 모든 채팅방에서 동일 에러 발생 |
| 메시지 전송 불가 | 채팅방 자체가 렌더링되지 않음 |

## 참고: Zustand selector 안티패턴

Zustand의 selector에서 새 객체/배열을 반환하면 매 렌더링마다 리렌더링이 발생합니다:

```tsx
// BAD — 매번 새 배열
useChatStore((s) => s.data ?? [])
useChatStore((s) => s.items.filter(i => i.active))
useChatStore((s) => ({ a: s.a, b: s.b }))

// GOOD — 안정적 참조
const EMPTY: T[] = [];
useChatStore((s) => s.data) ?? EMPTY
useChatStore(useShallow((s) => ({ a: s.a, b: s.b })))
```

---

## BUG-2: 한글 입력 시 끝 글자가 별도 메시지로 전송됨 (Critical)

### 증상

한글을 키보드로 입력하면 한 글자씩 끊어서 전송됨. 예: "안녕하세요" 입력 시 → "아ㄴ녕", "녕", "안녀ㅇ", "ㅇ" 등 조합 중간 글자가 별도 메시지로 전송.

### 원인

`ChatInput.tsx`의 `handleKeyDown`에서 한글 IME 조합(composition) 상태를 확인하지 않음.

한글 입력 중 Enter를 누르면:
1. IME가 조합 완료를 위해 `keydown` 이벤트 발생 (`isComposing: true`)
2. `handleKeyDown`이 이를 "전송" Enter로 처리
3. 현재까지 입력된 텍스트가 전송되고 입력창이 초기화됨
4. IME 조합이 끊기면서 다음 글자부터 새 메시지로 시작

### 수정

```diff
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
+     // IME 한글 조합 중에는 Enter 무시
+     if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );
```

### 수정 파일
- `src/app/(customer)/chat/[chatId]/_components/ChatInput.tsx`

---

## BUG-3: 중복 메시지 key 에러 (Medium)

### 증상

콘솔에 `Encountered two children with the same key` 에러 발생. 동일한 메시지 ID가 메시지 배열에 두 번 존재.

### 원인

WebSocket 연결이 여러 개 생성되거나, 같은 메시지가 `addMessage`로 중복 추가되는 경우 발생. `message_ack`로 확정된 메시지가 `chat_message`로도 도착할 수 있음.

### 수정

`chat.ts` 스토어의 `addMessage`에 중복 ID 체크 추가:

```diff
  addMessage: (chatId, message) =>
-   set((state) => ({
-     messages: {
-       ...state.messages,
-       [chatId]: [...(state.messages[chatId] ?? []), message],
-     },
-   })),
+   set((state) => {
+     const existing = state.messages[chatId] ?? [];
+     if (message.id && existing.some((m) => m.id === message.id)) {
+       return state;
+     }
+     return {
+       messages: {
+         ...state.messages,
+         [chatId]: [...existing, message],
+       },
+     };
+   }),
```

### 수정 파일
- `src/stores/chat.ts`

---

## 양방향 채팅 테스트 결과

고객(Playwright) ↔ 사장(Node.js WebSocket)으로 양방향 실시간 채팅 테스트 완료.

| 테스트 항목 | 결과 |
|------------|------|
| 고객 → 사장 메시지 전송 | PASS |
| 사장 → 고객 실시간 수신 | PASS |
| 읽음 표시 "1" 표시 | PASS |
| 사장 읽음 시 "1" 제거 | PASS |
| 날짜 구분선 | PASS |
| 발신자 이름 표시 (CS 사장174) | PASS |
| 중복 메시지 방지 | PASS (수정 후) |

## 수정된 파일 총정리

| 파일 | 변경 내용 |
|------|----------|
| `src/app/(customer)/chat/[chatId]/_components/MessageList.tsx` | getSnapshot 무한 루프 수정 |
| `src/app/(customer)/chat/[chatId]/_components/ChatInput.tsx` | IME 한글 조합 중 Enter 무시 |
| `src/stores/chat.ts` | 중복 메시지 addMessage 방지 |
