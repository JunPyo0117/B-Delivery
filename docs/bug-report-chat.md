# Bug Report: 채팅 기능 E2E 테스트

- **발견일**: 2026-03-26
- **심각도**: Critical
- **상태**: 해결 완료

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
