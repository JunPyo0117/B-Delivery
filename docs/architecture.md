# B-Delivery 시스템 아키텍처

## 서비스 구성도

```mermaid
graph LR
  Client[브라우저] --> WebApp[Next.js :3000]
  WebApp --> Postgres[(PostgreSQL :5432)]
  WebApp --> Redis[(Redis :6379)]
  WebApp --> MinIO[(MinIO :9000)]
  WebApp -->|Redis Stream| ChatServer[Node.js Chat :8080]
  ChatServer --> Redis
  Client -->|WebSocket| ChatServer
```

## 주문 상태 실시간 업데이트 흐름

```mermaid
sequenceDiagram
  participant Owner as 음식점 사장
  participant API as Next.js API
  participant DB as PostgreSQL
  participant Redis as Redis Stream
  participant Chat as Chat Server (Node.js)
  participant Customer as 고객 브라우저

  Owner->>API: 주문 상태 변경 (조리중/픽업완료/배달완료)
  API->>DB: Order.status 업데이트
  API->>Redis: order_updates_stream에 이벤트 발행
  Chat->>Redis: Stream 구독 (XREADGROUP)
  Chat->>Customer: WebSocket으로 상태 변경 푸시
  Customer->>Customer: UI 실시간 업데이트
```

## 채팅 메시지 흐름

```mermaid
sequenceDiagram
  participant User as 고객
  participant Chat as Chat Server (Node.js)
  participant DB as PostgreSQL

  User->>Chat: Socket.IO 연결 (JWT 토큰)
  Chat->>Chat: JWT 검증
  User->>Chat: 텍스트/이미지 메시지 전송
  Chat->>DB: Message 저장
  Chat->>User: Socket.IO로 상대방 메시지 실시간 전달
```

## Docker 서비스 구성

| 서비스 | 이미지 | 내부 포트 | 외부 포트 | 역할 |
|--------|--------|-----------|-----------|------|
| postgres | postgres:15-alpine | 5432 | 5432 | 메인 데이터베이스 |
| redis | redis:7-alpine | 6379 | 6379 | 주문 상태 Stream |
| minio | minio/minio | 9000, 9001 | 9000, 9001 | 이미지 스토리지 & 콘솔 |
| chat-server | node:20 | 8080 | 8080 | Socket.IO 실시간 서버 (채팅 + 주문 상태 푸시) |
| web-app | node:20 | 3000 | 3000 | Next.js 웹 앱 |

모든 컨테이너는 `bdelivery_net` 브리지 네트워크로 DNS 통신합니다.

## 주문 상태 흐름

```
PENDING (주문 접수)
  → COOKING (조리중) — 사장이 변경
    → PICKED_UP (픽업 완료/배달 중) — 사장이 변경
      → DONE (배달 완료) — 사장이 변경
  → CANCELLED (취소)
```
