# B-Delivery 시스템 아키텍처 (v3)

## 서비스 구성도

```mermaid
graph TB
    subgraph Clients
        Customer[고객 브라우저]
        Owner[사장 브라우저]
        Rider[배달기사 브라우저]
        Admin[관리자 브라우저]
    end

    subgraph "Application Layer"
        WebApp["Next.js :3000<br/>(프론트엔드 + API + Auth)"]
        Centrifugo["Centrifugo :8080<br/>(실시간 WebSocket 허브)"]
        Worker["Order Worker<br/>(Redis Stream 소비)"]
    end

    subgraph "Data Layer"
        Postgres[("PostgreSQL + PostGIS :5432<br/>(주문, 유저, 채팅, 공간 인덱스)")]
        Redis[("Redis :6379<br/>(Cache, Stream, GEO, Pub/Sub)")]
        MinIO[("MinIO :9000<br/>(이미지 스토리지)")]
    end

    Customer & Owner & Rider & Admin -->|HTTP| WebApp
    Customer & Owner & Rider & Admin -->|WebSocket| Centrifugo

    Centrifugo -->|"Proxy<br/>(Connect/Subscribe/Publish/RPC)"| WebApp

    WebApp --> Postgres
    WebApp --> Redis
    WebApp --> MinIO
    WebApp -->|"Redis Stream<br/>(주문/배달 이벤트)"| Worker

    Worker -->|XREADGROUP| Redis
    Worker -->|"HTTP API<br/>(/api/publish)"| Centrifugo
```

## 실시간 통신 구조 (Centrifugo Proxy 패턴)

```mermaid
graph LR
    subgraph "클라이언트"
        C[브라우저]
    end

    subgraph "Centrifugo"
        WS[WebSocket 서버]
    end

    subgraph "Next.js API"
        CP[Connect Proxy<br/>JWT 검증 + 채널 구독]
        SP[Subscribe Proxy<br/>채널 권한 확인]
        PP[Publish Proxy<br/>메시지 DB 저장]
        RP[RPC Proxy<br/>기사 위치 갱신]
    end

    C -->|"① WebSocket 연결<br/>(JWT 토큰)"| WS
    WS -->|"② 인증 위임"| CP
    WS -->|"③ 구독 권한 확인"| SP
    WS -->|"④ 채팅 메시지 저장"| PP
    WS -->|"⑤ 기사 위치 RPC"| RP
```

## 주문 + 배달 전체 플로우

```mermaid
sequenceDiagram
    participant C as 고객
    participant API as Next.js API
    participant DB as PostgreSQL
    participant Redis as Redis
    participant Worker as Order Worker
    participant Centro as Centrifugo
    participant O as 사장
    participant R as 배달기사

    C->>API: 주문 확정
    API->>DB: Order 생성 (PENDING)
    API->>Redis: order_updates_stream 발행
    Worker->>Redis: XREADGROUP
    Worker->>Centro: /api/publish → owner_orders#사장ID
    Centro->>O: WebSocket 신규 주문 알림

    O->>API: 주문 접수 (COOKING)
    API->>DB: Order.status = COOKING
    API->>Redis: order_updates_stream 발행
    Worker->>Centro: /api/publish → order#고객ID
    Centro->>C: WebSocket "조리중" 푸시

    O->>API: 배달 요청
    API->>DB: Delivery 생성 (REQUESTED), Order.status = WAITING_RIDER
    API->>Redis: delivery_requests_stream 발행
    Worker->>Redis: GEORADIUS rider:locations 3km
    Worker->>Centro: /api/publish → delivery_requests#기사ID
    Centro->>R: WebSocket 배달 요청

    R->>API: 배달 수락
    API->>DB: Delivery.riderId 할당, status = ACCEPTED
    API->>DB: Order.status = RIDER_ASSIGNED

    R->>Centro: RPC location:update
    Centro->>API: RPC Proxy
    API->>Redis: GEOADD rider:locations
    API->>Centro: /api/publish → order#고객ID
    Centro->>C: 기사 위치 실시간 전송

    R->>API: 배달 완료
    API->>DB: Order.status = DONE, Delivery.status = DONE
    API->>Redis: order_updates_stream 발행
    Worker->>Centro: /api/publish
    Centro->>C: WebSocket "배달 완료" 푸시
    Centro->>O: WebSocket "배달 완료" 푸시
```

## 채팅 메시지 흐름

```mermaid
sequenceDiagram
    participant User as 고객/사장/기사
    participant Centro as Centrifugo
    participant API as Next.js API (Publish Proxy)
    participant DB as PostgreSQL
    participant Admin as 관리자

    User->>Centro: WebSocket 연결 (JWT)
    Centro->>API: Connect Proxy (JWT 검증)
    API-->>Centro: user 정보 + 구독 채널

    User->>Centro: 채팅 메시지 전송 (chat:채널)
    Centro->>API: Publish Proxy
    API->>DB: Message 저장
    API-->>Centro: 발행 허용
    Centro->>Admin: 실시간 메시지 전달
```

## 배달기사 위치 추적

```mermaid
sequenceDiagram
    participant R as 배달기사
    participant Centro as Centrifugo
    participant API as Next.js API (RPC Proxy)
    participant Redis as Redis GEO
    participant C as 고객

    R->>API: toggleOnlineStatus()
    API->>DB: RiderLocation.isOnline = true
    API->>Redis: GEOADD rider:locations

    Note over API,Redis: 배달 요청 시
    Note over API,Redis: Order Worker → GEORADIUS 3km → 기사 검색

    Note over R,C: 배달 진행 중
    loop 5초 간격
        R->>Centro: RPC location:update {lat, lng}
        Centro->>API: RPC Proxy
        API->>Redis: GEOADD 갱신
        API->>Centro: /api/publish
        Centro->>C: rider:location 푸시
    end

    R->>API: toggleOnlineStatus()
    API->>DB: RiderLocation.isOnline = false
    API->>Redis: ZREM rider:locations
```

## Docker 서비스 구성

| 서비스 | 이미지 | 포트 | 역할 |
|--------|--------|------|------|
| postgres | postgres:15-alpine + PostGIS | 5432 | 메인 DB (공간 인덱스) |
| redis | redis:7-alpine | 6379 | Cache, Stream, GEO, Pub/Sub |
| centrifugo | centrifugo/centrifugo:v6 | 8080 | 실시간 WebSocket 허브 (Proxy 패턴) |
| order-worker | node:20 (tsx) | - | Redis Stream 소비 → Centrifugo 발행 |
| minio | minio/minio | 9000, 9001 | 이미지 스토리지 & 콘솔 |
| web-app | node:20 (Next.js) | 3000 | 프론트엔드 + 백엔드 API |

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

## Redis 역할 (4-in-1)

| 기능 | 용도 | 키/패턴 |
|------|------|---------|
| **Cache** | 음식점 목록 (5분 TTL), 메뉴 데이터 (10분 TTL) | `restaurant:*`, `menu:*` |
| **Stream** | 주문 상태 변경 이벤트 큐, 배달 요청 이벤트 큐 | `order_updates_stream`, `delivery_requests_stream` |
| **GEO** | 배달기사 실시간 위치 (GEOADD/GEORADIUS) | `rider:locations` |
| **Pub/Sub** | Centrifugo 수평 스케일링 시 노드 간 동기화 | - |

## 사용자 역할

| Role | 접근 가능 페이지 | 설명 |
|------|-----------------|------|
| USER | 홈, 음식점, 장바구니, 주문, 마이페이지, 채팅 | 일반 고객 |
| OWNER | 사장 대시보드 (주문관리, 메뉴관리, 배달요청, 매출통계) | 음식점 사장 |
| RIDER | 배달대기, 배달진행, 배달내역, 마이페이지 | 배달기사 |
| ADMIN | 관리자 대시보드 (KPI, 사용자관리, 고객센터 상담) | 플랫폼 관리자 |

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
| 반경 검색 | PostGIS 공간 인덱스 + Redis GEO |
| WebSocket | Centrifugo 수평 스케일링 (Redis Engine) |
| 비동기 처리 | Order Worker 다중 인스턴스 (Consumer Group) |
| 이미지 | MinIO + CDN |
| API 부하 | Next.js ISR (음식점 상세: revalidate 60s) |
| Rate Limiting | Redis 기반 (주문 분당 5회, 검색 분당 30회) |
