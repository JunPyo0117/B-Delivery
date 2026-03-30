# Bug Report: 모바일(사설 IP) 접속 시 채팅 메시지 미표시

- **발견일**: 2026-03-26
- **심각도**: Critical
- **상태**: 해결 완료
- **환경**: iPhone Safari, 사설 IP(172.30.1.51)로 Next.js dev 서버 접속

## 증상

로컬 PC(`localhost:3000`)에서는 채팅방 메시지가 정상 표시되지만, 같은 네트워크의 모바일 기기에서 사설 IP(`http://172.30.1.51:3000`)로 접속하면 채팅방 진입 후 **메시지가 전혀 보이지 않는** 빈 화면이 표시됨.

- 채팅방 UI(헤더, 입력 필드)는 정상 렌더링
- DB에 메시지 6건 존재 확인
- SSR 응답 200 OK, 서버 로그에서 `rawMessages=6` 확인

## 발생 원인

### 1차 원인: Go 채팅 서버 CORS 제한

`chat-server/cmd/server/main.go`에서 CORS `AllowOrigins`가 `http://localhost:3000`만 허용되어 있어, 사설 IP에서의 WebSocket 핸드셰이크가 403으로 차단됨.

```go
// 수정 전
app.Use(cors.New(cors.Config{
    AllowOrigins: "http://localhost:3000",
}))
```

이로 인해 모바일에서 WebSocket 연결 실패 → 실시간 메시지 송수신 불가.

### 2차 원인 (핵심): 클라이언트 JS Hydration 미실행

모바일에서 사설 IP로 Next.js dev 서버 접속 시 **클라이언트 사이드 JavaScript가 정상 실행되지 않음**.

**증거**: 서버 로그 비교

```
# 로컬 PC (정상)
GET /chat/d2f1d767-... 200
POST /api/chat/token 200        ← useWebSocket의 connect() 실행
GET /api/auth/session 200       ← NextAuth 클라이언트 세션 체크

# 모바일 (비정상)
GET /chat/d2f1d767-... 200
                                ← 클라이언트 요청 없음!
```

모바일에서 `POST /api/chat/token`과 `GET /api/auth/session`이 발생하지 않으므로, `useEffect` 등 클라이언트 사이드 코드가 실행되지 않은 것으로 판단.

추정 원인: Next.js dev 모드에서 사설 IP 접속 시 HMR WebSocket(`ws://172.30.1.51:3000/_next/webpack-hmr`) 연결 실패 등으로 인한 JS 번들 로딩/Hydration 지연 또는 실패.

### 기존 아키텍처의 문제

메시지 렌더링 흐름이 **클라이언트 JS 실행에 100% 의존**하는 구조:

```
SSR (서버) → initialMessages prop 전달 → ChatRoom (use client)
→ useEffect → Zustand store에 setMessages() → MessageList가 store 구독 → 렌더링
```

SSR HTML 자체에는 메시지가 포함되지 않음 (Zustand store가 서버에서 비어있으므로). JS가 실행되지 않으면 빈 화면.

## 해결 방법

### 수정 1: Go 서버 CORS 모든 오리진 허용 (개발 환경)

**파일**: `chat-server/cmd/server/main.go`

```diff
  app.Use(cors.New(cors.Config{
-     AllowOrigins: "http://localhost:3000",
+     AllowOrigins: "*",
      AllowHeaders: "Origin, Content-Type, Accept, Authorization",
  }))
```

> 프로덕션에서는 실제 도메인으로 제한 필요

### 수정 2: SSR HTML에 초기 메시지 직접 포함 (핵심 수정)

`MessageList`가 Zustand store 메시지가 없을 때 `initialMessages`를 fallback으로 사용하도록 변경.

**파일**: `src/app/(customer)/chat/[chatId]/_components/MessageList.tsx`

```diff
  interface MessageListProps {
    chatId: string;
    currentUserId: string;
+   initialMessages: PendingMessage[];
  }

- export function MessageList({ chatId, currentUserId }: MessageListProps) {
-   const messages = useChatStore((s) => s.messages[chatId]) ?? EMPTY_MESSAGES;
+ export function MessageList({ chatId, currentUserId, initialMessages }: MessageListProps) {
+   const storeMessages = useChatStore((s) => s.messages[chatId]);
+   const messages = storeMessages ?? initialMessages;
```

**파일**: `src/app/(customer)/chat/[chatId]/_components/ChatRoom.tsx`

```diff
- <MessageList chatId={chatId} currentUserId={currentUserId} />
+ <MessageList chatId={chatId} currentUserId={currentUserId} initialMessages={initialMessages} />
```

### 수정된 렌더링 흐름

```
SSR (서버):
  store 비어있음 → storeMessages = undefined → initialMessages 사용 → HTML에 메시지 포함!

클라이언트 Hydration 후:
  useEffect → store에 메시지 설정 → storeMessages 사용 → 실시간 메시지도 반영
```

## 수정 파일 총정리

| 파일 | 변경 내용 |
|------|----------|
| `chat-server/cmd/server/main.go` | CORS AllowOrigins `*`로 변경 |
| `src/app/(customer)/chat/[chatId]/_components/ChatRoom.tsx` | MessageList에 initialMessages prop 전달 |
| `src/app/(customer)/chat/[chatId]/_components/MessageList.tsx` | initialMessages를 SSR fallback으로 사용 |

## 검증

| 테스트 항목 | 결과 |
|------------|------|
| 로컬 PC(localhost) 채팅 메시지 표시 | PASS |
| 모바일(사설 IP) 채팅 메시지 표시 | PASS |
| 실시간 메시지 송수신 (WebSocket) | PASS |
| 무한 스크롤 (이전 메시지 로드) | 영향 없음 |

## 교훈

1. **SSR 컴포넌트에서 클라이언트 store 의존 최소화**: `use client` 컴포넌트라도 SSR HTML에 핵심 데이터를 포함시켜야 JS 실행 실패 시에도 콘텐츠가 표시됨.
2. **개발 환경 CORS 주의**: 사설 IP/다른 기기 테스트 시 CORS AllowOrigins를 확인할 것.
3. **모바일 디버깅 시 서버 로그 비교**: 클라이언트 요청 유무로 JS 실행 여부를 판단할 수 있음.
