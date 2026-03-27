# B-Delivery 시스템 아키텍처 (v2)

## 서비스 구성도

```mermaid
graph TB
    subgraph Clients
        Customer[고객 브라우저]
        Owner[사장 브라우저]
        Rider[배달기사 브라우저]
        Admin[관리자 브라우저]
    end

    subgraph CDN
        ImgCDN[이미지 CDN]
    end

    subgraph "Application Layer"
        WebApp[Next.js :3000]
        ChatServer[Node.js Chat :8080]
    end

    subgraph "Data Layer"
        Postgres[(PostgreSQL + PostGIS :5432)]
        PgRead[(PostgreSQL Read Replica :5433)]
        PgBouncer[PgBouncer :6432]
        Redis[(Redis :6379)]
        MinIO[(MinIO :9000)]
    end

    Customer & Owner & Rider & Admin --> WebApp
    Customer & Owner & Rider -->|WebSocket| ChatServer

    WebApp --> PgBouncer --> Postgres
    WebApp --> PgRead
    WebApp --> Redis
    WebApp --> MinIO
    WebApp -->|Redis Stream| ChatServer

    ChatServer --> Redis
    ChatServer --> Postgres

    MinIO --> ImgCDN
    ImgCDN --> Customer & Owner & Rider
```

## 주문 + 배달 전체 플로우

```mermaid
sequenceDiagram
    participant C as 고객
    participant API as Next.js API
    participant DB as PostgreSQL
    participant Redis as Redis
    participant Chat as Chat Server (Node.js)
    participant O as 사장
    participant R as 배달기사

    C->>API: 주문 확정
    API->>DB: Order 생성 (PENDING)
    API->>Redis: order_updates_stream 발행
    Chat->>Redis: XREADGROUP
    Chat->>O: WebSocket 신규 주문 알림

    O->>API: 주문 접수 (COOKING)
    API->>DB: Order.status = COOKING
    API->>Redis: 이벤트 발행
    Chat->>C: WebSocket "조리중" 푸시

    O->>API: 배달 요청
    API->>DB: Delivery 생성 (REQUESTED), Order.status = WAITING_RIDER
    API->>Redis: delivery_requests_stream 발행
    Chat->>Redis: GEORADIUS (반경 3km 기사 검색)
    Chat->>R: WebSocket 배달 요청 브로드캐스트

    R->>Chat: 배달 수락
    Chat->>DB: Delivery.riderId 할당, status = ACCEPTED, Order.status = RIDER_ASSIGNED
    Chat->>O: WebSocket 기사 배정 알림
    Chat->>C: WebSocket 기사 배정 알림

    R->>Chat: 가게 도착 (AT_STORE)
    R->>Chat: 픽업 완료 (PICKED_UP)
    Chat->>DB: Order.status = PICKED_UP
    Chat->>C: WebSocket "배달 중" + 기사 위치 실시간 전송

    loop 5초 간격 (배달 중)
        R->>Chat: location:update {lat, lng}
        Chat->>Redis: GEOADD rider:locations
        Chat->>C: rider:location 푸시
    end

    R->>Chat: 배달 완료
    Chat->>DB: Order.status = DONE, Delivery.status = DONE
    Chat->>C: WebSocket "배달 완료" 푸시
    Chat->>O: WebSocket "배달 완료" 푸시
```

## 채팅 메시지 흐름

```mermaid
sequenceDiagram
    participant User as 고객
    participant Chat as Chat Server (Node.js + Socket.IO)
    participant DB as PostgreSQL

    User->>Chat: Socket.IO 연결 (JWT 토큰)
    Chat->>Chat: JWT 검증
    User->>Chat: 텍스트/이미지 메시지 전송
    Chat->>DB: Message 저장
    Chat->>User: Socket.IO로 상대방 메시지 실시간 전달
```

## 배달기사 위치 추적

```mermaid
sequenceDiagram
    participant R as 배달기사
    participant Chat as Chat Server
    participant Redis as Redis GEO
    participant C as 고객

    R->>Chat: WebSocket 연결 (JWT)
    R->>Chat: online:toggle (온라인 전환)
    Chat->>Redis: GEOADD rider:locations

    Note over Chat,Redis: 배달 요청 시
    Chat->>Redis: GEORADIUS rider:locations 3km
    Redis-->>Chat: 온라인 + 미배달 기사 목록

    Note over R,C: 배달 진행 중
    loop 5초 간격
        R->>Chat: location:update {lat, lng}
        Chat->>Redis: GEOADD 갱신
        Chat->>C: rider:location 푸시
    end
```

## Docker 서비스 구성

| 서비스 | 이미지 | 내부 포트 | 외부 포트 | 역할 |
|--------|--------|-----------|-----------|------|
| postgres | postgres:15-alpine + PostGIS | 5432 | 5432 | 메인 DB (공간 인덱스) |
| postgres-read | postgres:15-alpine | 5432 | 5433 | 읽기 전용 레플리카 |
| pgbouncer | pgbouncer | 6432 | 6432 | 커넥션 풀링 |
| redis | redis:7-alpine | 6379 | 6379 | 캐시, Stream, GEO, Pub/Sub |
| minio | minio/minio | 9000, 9001 | 9000, 9001 | 이미지 스토리지 & 콘솔 |
| chat-server | node:20 | 8080 | 8080 | Socket.IO 실시간 서버 |
| web-app | node:20 (Next.js) | 3000 | 3000 | 메인 웹 애플리케이션 |

모든 컨테이너는 `bdelivery_net` 브리지 네트워크로 DNS 통신합니다.

## 주문 상태 흐름 (State Machine)

```mermaid
stateDiagram-v2
    [*] --> PENDING: 고객 주문
    PENDING --> COOKING: 사장 접수
    PENDING --> CANCELLED: 고객 취소 / 사장 거절
    COOKING --> WAITING_RIDER: 사장 배달 요청
    COOKING --> CANCELLED: 사장 취소
    WAITING_RIDER --> RIDER_ASSIGNED: 기사 수락
    WAITING_RIDER --> COOKING: 매칭 실패 (재요청)
    RIDER_ASSIGNED --> PICKED_UP: 기사 픽업
    PICKED_UP --> DONE: 기사 배달 완료
    DONE --> [*]
    CANCELLED --> [*]
```

```
PENDING (주문 접수) — 고객/사장 취소 가능
  → COOKING (조리중) — 사장이 접수
    → WAITING_RIDER (기사 매칭 대기) — 사장이 배달 요청
      → RIDER_ASSIGNED (기사 배정) — 기사가 수락
        → PICKED_UP (픽업 완료/배달 중) — 기사가 픽업
          → DONE (배달 완료) — 기사가 완료
  → CANCELLED (취소) — 상태별 취소 규칙 적용
```

## 사용자 역할

| Role | 접근 가능 페이지 | 설명 |
|------|-----------------|------|
| USER | 홈, 음식점, 장바구니, 주문, 마이페이지, 채팅 | 일반 고객 |
| OWNER | USER + 사장 대시보드 (주문관리, 메뉴관리, 배달요청) | 음식점 사장 |
| RIDER | 배달대기, 배달진행, 배달내역, 마이페이지 | 배달기사 |
| ADMIN | USER + 관리자 대시보드 | 플랫폼 관리자 |

## 캐싱 전략

| 대상 | 저장소 | TTL | 무효화 |
|------|--------|-----|--------|
| 음식점 목록 | Redis | 5분 | 등록/수정/삭제 시 |
| 메뉴 데이터 | Redis | 10분 | 수정/품절 시 |
| 배달기사 위치 | Redis GEO | 실시간 | 5초 갱신 |
| 사용자 세션 | JWT | - | 만료 시 |

## 스케일링 전략 (10만 유저)

| 구간 | 전략 |
|------|------|
| DB 읽기 부하 | Read Replica 분리 (홈 피드, 검색) |
| DB 커넥션 | PgBouncer 커넥션 풀링 |
| 반경 검색 | PostGIS 공간 인덱스 |
| WebSocket | Socket.IO Redis Adapter → 수평 스케일링 |
| 이미지 | MinIO + CDN |
| API 부하 | Next.js ISR (음식점 상세: revalidate 60s) |
| Rate Limiting | Redis 기반 (주문 분당 5회, 검색 분당 30회) |
