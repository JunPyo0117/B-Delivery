# Project Name: B-Delivery (Food Delivery Platform) — PRD v2
# Date: 2026-03-27 (v2 전면 개정)
# Version: 2.0

## 1. 프로젝트 개요
- **프로젝트명:** 비디릴버리 (B-Delivery)
- **플랫폼:** 웹앱 (모바일 반응형 웹, 앱 미출시)
- **목적:** 위치 기반 음식 주문/배달 플랫폼 웹앱 — 10만 유저 규모 대응
- **목표:** 고객 주문 → 사장 접수 → 배달기사 매칭 → 배달 완료까지 끊김 없는 Full-Cycle 동작
- **타겟 유저:** 주문 고객 / 음식점 사장 / 배달기사 / 플랫폼 관리자
- **디자인 소스:** 루트 디렉토리 `ui/` 폴더 내 스크린샷 참조


## 2. 목표 & 성공 기준

### 성공 기준 (Must Have)
- 사용자가 Google 소셜 로그인할 수 있다
- GPS 또는 검색 기반으로 배달 주소를 설정할 수 있다
- 설정된 주소 반경 3km 기준으로 음식점 리스트가 노출된다
- 음식점 상세 페이지에서 메뉴를 확인하고, **옵션(사이즈/토핑 등)을 선택**하여 장바구니에 담을 수 있다
- 장바구니에서 주문 확정 시 **품절/가격 변동 검증**이 수행된다
- 음식점 사장이 주문을 접수하고 **배달기사에게 배달을 요청**할 수 있다
- **배달기사가 배달 요청을 수락하고, 픽업 → 배달 → 완료** 처리할 수 있다
- 배달 중 **기사의 실시간 위치가 고객 화면에 표시**된다
- 고객/사장 모두 **주문 취소/거절**이 가능하다 (상태별 규칙 적용)
- 고객센터와 실시간 1:1 채팅(텍스트/이미지)이 가능하다
- 별점(1~5점) 기반 음식점 리뷰 작성 및 **사장 답글**이 가능하다
- 마이페이지에서 주문 내역 / 관심 음식점 목록을 관리할 수 있다
- 관리자 페이지에서 음식점/유저/주문/배달기사를 관리할 수 있다

### 성능 목표 (10만 유저 기준)
- API 응답시간: p95 < 500ms
- 반경 검색: 음식점 1만개 기준 < 200ms (공간 인덱스 활용)
- WebSocket 동시접속: 1만명 이상
- 이미지 로딩: CDN 적용 < 1초
- 배달기사 위치 갱신: 5초 간격, 지연 < 1초

### 비목표 (Not Goal)
- 알림 푸시 (FCM 등)
- 실결제(PG) 연동
- 추천 알고리즘 고도화
- 검색 랭킹 최적화
- 광고 음식점 상단 노출
- RIDER/OWNER 등록 심사 (신원 확인, 사업자 인증 등)
- 지역 히트맵 (주문 집중 지역 시각화)
- 검색 트렌드 / 워드클라우드
- 배달 반경 티어 관리 (행정구역별 반경 정책)
- 금칙어 자동 필터링


## 3. 사용자 플로우

### 3.1 주문 플로우 (고객)
1. Google 소셜 로그인
2. 최초 로그인 또는 주소 미설정 시 주소 설정 화면으로 이동
   - **위치 권한 허용 시:** 현재 위치 자동 감지 → 주소 자동 설정
   - **위치 권한 거부 시:** 카카오 우편번호 검색으로 수동 입력
   - 주소 설정 완료 전까지 홈 화면 진입 불가
3. 설정된 주소 반경 3km 기준 음식점 리스트 탐색
4. 음식점 클릭 → 메뉴 리스트 → 메뉴 선택 → **옵션 선택** → 장바구니 담기
5. 한 음식점의 음식들만 장바구니에 담을 수 있음 (다른 음식점 선택 시 기존 장바구니 초기화 경고)
6. 장바구니에서 주문 확정 → **품절/가격 변동 실시간 검증** → 주문 완료
7. 음식점 사장이 주문 확인 후 '조리중' 상태로 변경 → 고객 화면 실시간 업데이트
8. 사장이 조리 70~80% 완료 시점에 **'배달 요청'** → 시스템이 근처 배달기사에게 브로드캐스트
9. **배달기사가 수락** → 가게로 이동 → 음식 픽업
10. **배달기사가 '픽업 완료' 처리** → 고객 화면에 기사 실시간 위치 + "배달 중, 도착 예정 N분" 표시
11. **배달기사가 '배달 완료' 처리** → 고객 화면 실시간 업데이트
12. 고객은 해당 음식점에 대한 리뷰 작성 (선택)

### 3.2 음식점 등록 플로우 (사장)
1. Google 소셜 로그인 (일반 고객과 동일)
2. 마이페이지 → "음식점 등록하기" 버튼 클릭
3. 음식점 정보 입력 (이름, 카테고리, 주소, 배달비 등)
   - 음식점 위치: 카카오 우편번호 검색으로 주소 입력 → 위도/경도 자동 변환
4. 등록 완료 → `role` USER → OWNER 변경
5. 사장 페이지 (주문 관리, 메뉴 관리, 배달 요청) 접근 가능

### 3.3 배달기사 플로우 (NEW)
1. Google 소셜 로그인
2. 마이페이지 → "배달기사 등록하기" 버튼 클릭
3. 기사 정보 입력 (이동 수단, 활동 지역 등)
4. 등록 완료 → `role` USER → RIDER 변경
5. 배달기사 전용 화면 접근 가능
6. **온라인/오프라인 토글** → 온라인 시 배달 요청 수신 시작
7. 배달 요청 수신 → 상세 확인 (가게 위치, 고객 위치, 거리, 예상 배달비)
8. **수락** → 가게로 이동 → **'가게 도착'** 버튼
9. 음식 수령 → **'픽업 완료'** 버튼 → 고객 위치로 이동
10. 이동 중 **5초 간격으로 위치 전송** (고객 화면에 실시간 표시)
11. 고객에게 전달 → **'배달 완료'** 버튼
12. 배달 내역 및 수익 확인 가능

### 3.4 주문 취소/거절 플로우 (NEW)

#### 상태 전이 규칙 (State Machine)

```mermaid
stateDiagram-v2
    [*] --> PENDING: 고객 주문
    PENDING --> COOKING: 사장 접수
    PENDING --> CANCELLED: 고객 취소 / 사장 거절
    COOKING --> WAITING_RIDER: 사장 배달 요청
    COOKING --> CANCELLED: 사장 취소 (재료 소진 등)
    WAITING_RIDER --> RIDER_ASSIGNED: 기사 수락
    WAITING_RIDER --> COOKING: 매칭 실패 (재요청 가능)
    RIDER_ASSIGNED --> WAITING_RIDER: 기사 취소 (사고/고장 등)
    RIDER_ASSIGNED --> PICKED_UP: 기사 픽업
    PICKED_UP --> DONE: 기사 배달 완료
    DONE --> [*]
    CANCELLED --> [*]
```

#### OrderStatus ↔ DeliveryStatus 매핑

| OrderStatus | DeliveryStatus | 설명 |
|-------------|---------------|------|
| WAITING_RIDER | REQUESTED | 배달 요청, 기사 매칭 대기 |
| RIDER_ASSIGNED | ACCEPTED | 기사 수락 완료 |
| RIDER_ASSIGNED | AT_STORE | 기사가 가게에 도착 (Order는 그대로) |
| PICKED_UP | PICKED_UP | 기사 픽업 완료 |
| PICKED_UP | DELIVERING | 고객에게 이동 중 (Order는 그대로) |
| DONE | DONE | 배달 완료 |
| CANCELLED | CANCELLED | 취소 |

> **규칙:** Order.status는 고객에게 보여주는 큰 단계, Delivery.status는 기사의 세부 진행 상태. Order.status 변경은 PICKED_UP, DONE 시점에만 발생하고, AT_STORE/DELIVERING은 Delivery.status만 변경.

#### 취소 가능 주체 & 조건

| 주문 상태 | 고객 취소 | 사장 거절/취소 | 기사 취소 | 비고 |
|-----------|----------|--------------|----------|------|
| PENDING | O | O | - | 자유 취소 |
| COOKING | O (취소 수수료 안내) | O (사유 필수) | - | 조리 시작 후 취소는 사유 기록 |
| WAITING_RIDER | X | O | - | 기사 매칭 전까지만 |
| RIDER_ASSIGNED | X | X | O (사유 필수) | 기사 취소 시 WAITING_RIDER로 재매칭 |
| PICKED_UP | X | X | X | CS를 통해서만 취소 가능 |
| DONE | X | X | X | 취소 불가 |


## 4. 기술 스택 (Tech Stack)

### 4.1 Frontend (Web)
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Component:** Tailwind CSS, shadcn/ui
- **Maps:**
  - Kakao Map API (JS 키 필요) — 음식점 위치 지도 표시, 배달기사 실시간 위치 추적
  - Kakao 우편번호 서비스 (키 불필요, 스크립트 로드만) — 배달 주소 검색 팝업
- **State Management:** Zustand
- **Real-time:** Socket.IO Client

### 4.2 Backend (App Server)
- **Framework:** Next.js API Routes (Server Actions)
- **Auth:** NextAuth.js v5 (Google Social Login only)
- **Storage:** Presigned URL Strategy (MinIO)
- **Spatial Query:** PostGIS 확장 또는 Prisma raw query + 공간 인덱스

### 4.3 Backend (Chat & Real-time Server)
- **Language:** Node.js (TypeScript)
- **Framework:** Socket.IO
- **Protocol:** WebSocket
- **Messaging:** Redis Streams (Next.js → Redis → Chat Server → Client 이벤트 파이프라인)
- **Scaling:** Socket.IO Redis Adapter (수평 스케일링)
- **Feature:**
  - 고객센터 실시간 1:1 채팅, 읽음 처리, 메시지 작성 중 표시
  - 주문 상태 변경 실시간 푸시
  - **배달기사 위치 실시간 추적 및 푸시**
  - **배달 요청 브로드캐스트 (근처 기사에게)**

### 4.4 Data & Infra
- **Runtime:** Docker
- **Orchestration:** `docker-compose`
- **DB:** PostgreSQL 15 + Prisma ORM + **PostGIS (공간 인덱스)**
- **Cache:** Redis 7 (Cache + Streams + **GEO**)
- **Object Storage:** MinIO + **CDN (이미지 최적화)**
- **Connection Pool:** PgBouncer (커넥션 풀 관리)

### 4.5 프로젝트 구조 (FSD — Feature-Sliced Design)

프론트엔드는 FSD 아키텍처를 따른다. 기능 단위로 코드를 응집시키고, 레이어 간 의존성 방향을 단방향으로 강제한다.

```
app → pages → widgets → features → entities → shared
         상위 레이어는 하위만 import 가능 (역방향 금지)
```

```
src/
├── app/                      # 라우팅만 (page.tsx → pages/ import)
│   ├── (customer)/           # 고객 라우트
│   ├── (owner)/              # 사장 라우트
│   ├── (rider)/              # 배달기사 라우트
│   ├── (admin)/              # 관리자 라우트
│   └── api/                  # API Routes
├── pages/                    # 페이지 조합 (위젯 조합)
├── widgets/                  # 독립 UI 블록 (자체 데이터 페칭)
├── features/                 # 사용자 인터랙션 단위
│   ├── auth/                 # 인증
│   ├── cart/                 # 장바구니
│   ├── order/                # 주문 상태
│   ├── chat/                 # 채팅
│   ├── delivery/             # 배달 요청/수락/매칭
│   ├── rider-location/       # 기사 위치 추적
│   ├── review/               # 리뷰
│   ├── favorite/             # 찜
│   ├── search/               # 검색
│   └── menu-option/          # 메뉴 옵션 선택
├── entities/                 # 비즈니스 엔티티 (UI + 타입 + API)
│   ├── restaurant/ menu/ order/ user/ rider/ delivery/ chat/ review/
├── shared/                   # 인프라, 공용 유틸
│   ├── api/                  # prisma, redis, minio
│   ├── config/               # 상수
│   ├── lib/                  # kakao, image-compress
│   └── ui/                   # shadcn/ui
└── generated/                # Prisma 자동 생성
```

각 슬라이스 내부는 `ui/`, `model/`, `api/`, `lib/` 세그먼트로 구성하며, 외부에서는 `index.ts` re-export만 접근 가능.


## 5. 시스템 아키텍처 (Docker Composition)

### 5.1 아키텍처 다이어그램

```mermaid
graph TB
    subgraph Client
        Customer[고객 브라우저]
        Owner[사장 브라우저]
        Rider[배달기사 브라우저]
        Admin[관리자 브라우저]
    end

    subgraph CDN
        ImgCDN[이미지 CDN]
    end

    subgraph "Load Balancer"
        LB[Nginx / ALB]
    end

    subgraph "Application Layer"
        WebApp1[Next.js :3000 ①]
        WebApp2[Next.js :3000 ②]
        ChatServer1[Chat Server :8080 ①]
        ChatServer2[Chat Server :8080 ②]
    end

    subgraph "Data Layer"
        PG_Primary[(PostgreSQL Primary)]
        PG_Read[(PostgreSQL Read Replica)]
        Redis[(Redis Cluster)]
        MinIO[(MinIO)]
    end

    Customer & Owner & Rider & Admin --> LB
    LB --> WebApp1 & WebApp2
    Customer & Owner & Rider -->|WebSocket| ChatServer1 & ChatServer2

    WebApp1 & WebApp2 --> PG_Primary
    WebApp1 & WebApp2 --> PG_Read
    WebApp1 & WebApp2 --> Redis
    WebApp1 & WebApp2 --> MinIO

    ChatServer1 & ChatServer2 --> Redis
    ChatServer1 & ChatServer2 --> PG_Primary

    MinIO --> ImgCDN
    ImgCDN --> Customer & Owner & Rider
```

### 5.2 서비스 컨테이너 정의

| 서비스명 | 이미지/기반 | 내부 포트 | 외부 포트 | 역할 |
|:---|:---|:---|:---|:---|
| `postgres` | `postgres:15-alpine` + PostGIS | 5432 | 5432 | 메인 데이터베이스 (공간 인덱스) |
| `postgres-read` | `postgres:15-alpine` | 5432 | 5433 | 읽기 전용 레플리카 |
| `pgbouncer` | `pgbouncer` | 6432 | 6432 | 커넥션 풀링 |
| `redis` | `redis:7-alpine` | 6379 | 6379 | 캐시, Stream, GEO, Pub/Sub |
| `minio` | `minio/minio` | 9000, 9001 | 9000, 9001 | 이미지 스토리지 & 콘솔 |
| `chat-server` | `node:20` (Custom) | 8080 | 8080 | Socket.IO 실시간 서버 |
| `web-app` | `node:20` (Next.js) | 3000 | 3000 | 메인 웹 애플리케이션 |

**중요:** 모든 컨테이너는 `bdelivery_net` 네트워크 브리지를 통해 DNS로 통신한다.

### 5.3 배달기사 위치 추적 아키텍처

```mermaid
sequenceDiagram
    participant Rider as 배달기사 브라우저
    participant Chat as Chat Server
    participant Redis as Redis GEO
    participant Customer as 고객 브라우저

    Rider->>Chat: WebSocket 연결 (JWT)
    loop 5초 간격
        Rider->>Chat: location:update {lat, lng}
        Chat->>Redis: GEOADD rider:locations riderId lat lng
    end

    Note over Chat,Redis: 배달 요청 시 근처 기사 검색
    Chat->>Redis: GEORADIUS rider:locations storeLat storeLng 3km
    Redis-->>Chat: 온라인 + 미배달 중인 기사 목록
    Chat->>Rider: delivery:request {orderId, storeInfo, dropoffInfo}

    Note over Chat,Customer: 배달 중 위치 실시간 전달
    Rider->>Chat: location:update {lat, lng}
    Chat->>Customer: rider:location {lat, lng, estimatedMinutes}
```

### 5.4 주문 상태 실시간 업데이트 흐름

```mermaid
sequenceDiagram
    participant Owner as 음식점 사장
    participant API as Next.js API
    participant DB as PostgreSQL
    participant Redis as Redis Stream
    participant Chat as Chat Server
    participant Customer as 고객 브라우저
    participant Rider as 배달기사 브라우저

    Owner->>API: 주문 상태 변경 (조리중)
    API->>DB: Order.status 업데이트
    API->>Redis: order_updates_stream 이벤트 발행
    Chat->>Redis: XREADGROUP (Stream 구독)
    Chat->>Customer: WebSocket 상태 변경 푸시

    Owner->>API: 배달 요청
    API->>DB: Delivery 생성 (REQUESTED)
    API->>Redis: delivery_requests_stream 이벤트 발행
    Chat->>Redis: GEORADIUS (근처 기사 검색)
    Chat->>Rider: WebSocket 배달 요청 브로드캐스트

    Rider->>Chat: 배달 수락
    Chat->>DB: Delivery.status = ACCEPTED, riderId 할당
    Chat->>Owner: WebSocket 기사 배정 알림
    Chat->>Customer: WebSocket 기사 배정 알림
```


## 6. 기능 명세 (Functional Specifications)

> **UI 참조 안내**
> 아래 각 섹션에 명시된 파일명은 `ui/` 폴더 내 스크린샷입니다. 구현 시 반드시 해당 이미지를 참고하세요.
> | 파일명 | 해당 화면 |
> |:---|:---|
> | `1.메인페이지.png` | 홈 화면 (Feed) |
> | `2.찜목록페이지.png` | 관심 음식점 (찜) |
> | `3.가게상세페이지.png` | 음식점 상세 상단 |
> | `6.가게 페이지.png` | 음식점 메뉴 탭 |
> | `7. 가게페이지2.png` | 음식점 상세 배달 정보 |
> | `8. 음식점 리뷰페이지.png` | 리뷰 목록 페이지 |
> | `9. 장바구니페이지.png` | 장바구니 (빈 상태) |
> | `10. 장바구니페이지 2.png` | 장바구니 (담긴 상태) |
> | `11. 장바구니에 다른 가게 메뉴 담겨있는데 다른 가게 메뉴 담을때 팝업.png` | 장바구니 초기화 경고 팝업 |
> | `12. 상담 채팅 페이지.png` | 고객센터 채팅 |
> | `4.마이페이지.png` | 마이페이지 |
> | `5.주문내역.png` | 주문 내역 |

---

### 공통 UI

#### 하단 네비게이션 (Global)
- **고객 (USER):** 4탭 — 홈 / 찜 / 주문내역 / 마이페이지
- **사장 (OWNER):** 4탭 — 홈 / 주문관리 / 메뉴관리 / 마이페이지
- **배달기사 (RIDER):** 3탭 — 배달대기 / 배달내역 / 마이페이지
- **관리자 (ADMIN):** 사이드바 네비게이션 (하단 탭 없음)
- 모든 페이지 하단에 항상 표시 (ADMIN 제외)

---

### [P0: 필수 구현 — 고객 기능]

#### 6.1 사용자 인증 (User Auth)
- 소셜 로그인 (Google)
- 이메일 가입 없음
- 역할: USER (기본) / OWNER / RIDER / ADMIN
- **역할 규칙:** 사용자는 1개의 역할만 보유 가능. OWNER 또는 RIDER 등록은 `role == USER`일 때만 가능. 이미 OWNER인 사용자는 RIDER 등록 불가 (역도 동일).

#### 6.2 사용자 프로필 화면
- 닉네임, 프로필 사진, 기본 배달 주소
- '프로필 수정' 버튼

#### 6.3 배달 주소 설정 (Location)
- **위치 권한 요청 흐름:**
  - 최초 로그인 또는 주소 미설정 상태에서 홈 진입 시 브라우저 위치 권한 요청 팝업 표시
  - **허용:** Geolocation API로 현재 위도/경도 획득 → 카카오 좌표→주소 변환 API로 현재 주소 자동 설정
  - **거부:** 카카오 우편번호 서비스로 수동 주소 입력 유도 (거부해도 서비스 이용 가능)
  - 권한 거부 후 재요청 불가 (브라우저 정책) → 주소 직접 입력 안내 문구 표시
- **카카오 우편번호 서비스 (postcode.map.kakao.com)** 로 수동 주소 검색
  - 팝업 방식으로 주소 검색 → 도로명/지번 주소 선택 → 상세주소 직접 입력
  - 선택된 주소의 위도/경도 변환 후 DB 저장
- 설정된 주소 반경 3km 내 음식점 탐색에 사용

#### 6.4 홈 화면 (Feed)
*UI 참조: `ui/1.메인페이지.png`*
- 반경 3km 내 음식점 리스트 (무한 스크롤)
- **카테고리 아이콘 (가로 스크롤):**
  - 전체 / 한식 / 중식 / 일식 / 치킨 / 피자 / 분식 / 족발·보쌈 / 패스트푸드 / 카페·디저트 / 짬·탕 / 한그릇 / 기타
  - enum 매핑: KOREAN / CHINESE / JAPANESE / CHICKEN / PIZZA / BUNSIK / JOKBAL / FASTFOOD / CAFE / JJAMBBONG / RICE_BOWL / ETC
  - 아이콘 형태로 표시, 선택 시 해당 카테고리 음식점만 필터링
- 정렬: 배달 빠른 순, 평점 순, 최소 주문금액 순
- 카드 정보: 썸네일, 음식점명, 카테고리, 평점(별점), 리뷰 수, 배달 예상 시간, 최소 주문금액
- **캐싱:** 음식점 목록 Redis Cache (TTL 5분)

#### 6.4-1 검색 (Search)
*UI 참조: `ui/1.메인페이지.png` 상단 검색창*
- **검색어 입력 시 아래 세 가지를 통합 검색:**
  - **음식점 검색:** 음식점명이 일치하는 결과
  - **메뉴명 검색:** 검색어와 일치하는 메뉴를 보유한 음식점 목록
  - **메뉴 카테고리 검색:** 판매자가 등록한 메뉴 카테고리가 일치하는 음식점 목록
- 검색 결과 카드: 음식점명, 매칭된 메뉴명, 가격, 평점
- 검색 결과 클릭 시 해당 음식점 상세 페이지로 이동

#### 6.5 음식점 상세 + 메뉴
*UI 참조: `ui/3.가게상세페이지.png`, `ui/6.가게 페이지.png`, `ui/7. 가게페이지2.png`*
- 음식점 정보: 이름, 대표 사진, 평점, 리뷰 수, 영업시간, 최소 주문금액, 배달비
- **영업 상태 표시:** 영업 중 / 영업 종료 / 준비 중 — **영업 종료 시 주문 버튼 비활성화**
- **메뉴 탭:** 인기 메뉴 / 신메뉴 / 전체 메뉴 (가로 스크롤 탭)
  - 인기 메뉴 탭: 순위 뱃지 + 사장님 추천 뱃지 표시
- 메뉴 카드: 메뉴명, 가격, 리뷰 수, 썸네일, `+` 버튼으로 바로 담기
- **품절 표시:** `isSoldOut == true`인 메뉴는 흐리게 표시 + "품절" 뱃지 + 담기 버튼 비활성화
- 메뉴 클릭 → **옵션 선택 바텀시트** → 수량 선택 + 장바구니 담기

#### 6.5-1 메뉴 옵션 시스템 (NEW)
- **옵션 그룹 (MenuOptionGroup):** 사장이 메뉴별로 옵션 그룹 생성
  - 예: "사이즈 선택", "토핑 추가", "맛 선택"
  - 속성: 그룹명, 필수 여부(`isRequired`), 최대 선택 수(`maxSelect`)
- **옵션 항목 (MenuOption):** 각 그룹 내 선택지
  - 예: "레귤러 (+0원)", "라지 (+2,000원)", "치즈 추가 (+1,500원)"
  - 속성: 옵션명, 추가 가격(`extraPrice`)
- **바텀시트 UI:**
  - 필수 옵션 그룹: 하나 이상 선택하지 않으면 담기 불가
  - 선택 옵션 그룹: 0개 ~ maxSelect개 선택 가능
  - 선택에 따라 하단 총 가격 실시간 갱신
- **장바구니 반영:** 같은 메뉴라도 옵션이 다르면 별도 아이템으로 표시

#### 6.6 장바구니 & 주문
*UI 참조: `ui/9. 장바구니페이지.png`, `ui/10. 장바구니페이지 2.png`, `ui/11. 장바구니에 다른 가게 메뉴 담겨있는데 다른 가게 메뉴 담을때 팝업.png`*
- 담긴 메뉴 목록, **선택한 옵션 표시**, 수량 조정(+/-), 합계 금액 표시
- **+ 메뉴 추가** 버튼으로 같은 음식점 메뉴 추가
- 한 음식점 메뉴만 담기 가능
  - 다른 음식점 메뉴 담을 시 팝업: "장바구니에는 같은 가게의 메뉴만 담을 수 있습니다. 선택하신 메뉴를 장바구니에 담을 경우 이전에 담은 메뉴가 삭제됩니다." → 취소 / 담기
- **주문 확정 시 검증 (NEW):**
  1. 품절 체크: 장바구니 내 메뉴 중 `isSoldOut == true`인 항목이 있으면 경고 + 해당 메뉴 제거 유도
  2. 가격 변동 체크: 장바구니 담은 시점 가격 vs 현재 DB 가격 비교 → 차이 있으면 "가격이 변경되었습니다" 안내
  3. 영업 상태 체크: 해당 음식점이 영업 중인지 확인
  4. 최소 주문금액 체크
- **배달 요청사항 입력 (선택):** "문 앞에 놓아주세요", "벨 누르지 마세요" 등 자유 텍스트
- 검증 통과 시 주문 완료 → 주문 상태 페이지로 이동

#### 6.7 주문 상태
- 주문 현황 클릭 시 **카카오 지도에 음식점 위치 핀 표시** + 현재 주문 상태 오버레이
- 주문 상태 프로그레스 바: 주문 접수 → 조리중 → 기사 배정 → 픽업 → 배달 중 → 배달 완료
- **WAITING_RIDER 상태:** "배달기사를 찾고 있어요..." 애니메이션
- **RIDER_ASSIGNED 상태:** 배달기사 정보 표시 (닉네임, 이동 수단)
- **PICKED_UP 상태:** 지도에 **배달기사 실시간 위치 핀** + "배달 중, 도착 예정 N분" 텍스트
  - N분 계산: 직선거리 기반 예상 시간 (거리 / 이동수단별 평균속도)
  - **이동수단별 평균속도:** 도보 4km/h, 자전거 15km/h, 오토바이 30km/h, 자동차 25km/h
- **취소 버튼:** PENDING/COOKING 상태에서만 표시
- 상태 변경 흐름: 사장/기사가 버튼 클릭 → Next.js API → DB 업데이트 + Redis Stream → Chat Server → WebSocket 푸시

---

#### 6.8 채팅 (고객센터 1:1 Chat)
*UI 참조: `ui/12. 상담 채팅 페이지.png`*

**6.8.1 채팅 구조**
- **고객센터 응답자:** `role == ADMIN`인 사용자가 응답. 채팅방 생성 시 대기 중인 ADMIN이 자동 배정됨.
- Chat 모델에 `adminId`로 담당 관리자를 기록.
- ADMIN이 부재 시 시스템 메시지: "현재 상담 대기 중입니다. 순서대로 연결해 드릴게요."

**6.8.2 채팅 시작 방식**
- 채팅 진입 시 **문의할 주문 먼저 선택** (최근 주문 목록 표시)
- 주문 선택 → 해당 주문과 연결된 채팅방 생성 또는 기존 채팅방 이동
- **"주문 말고 다른 문의가 있어요" 버튼 → orderId 없이 일반 문의 채팅방 생성 (NEW)**

**6.8.3 채팅 목록**
- 채팅방 리스트 (최신 메시지 순 정렬)
- 각 리스트 아이템 표시: 상대방 이름, 마지막 메시지, 전송 시간, 읽지 않은 메시지 수 뱃지

**6.8.4 채팅방 (Message Room)**
- **실시간 통신:** WebSocket 기반 메시지 즉시 송수신
- **헤더:** 연결된 주문 정보 고정 (주문 번호, 음식점명) → 클릭 시 주문 상세 이동
  - 일반 문의인 경우 "일반 문의" 표시
- **메시지 타입:**
  - **텍스트 (TEXT):** Enter 전송, Shift+Enter 줄바꿈
  - **이미지 (IMAGE):** image/* 타입만 허용, 최대 5MB, MinIO Presigned URL 업로드
  - **시스템 메시지 (SYSTEM):** 주문 관련 자동 생성 (예: "주문 #1234 관련 문의가 접수되었습니다")
- **부가 기능:**
  - 읽음 확인 (숫자 1 표시 → 상대방 읽으면 사라짐)
  - 메시지 전송 시간 표시 (오전/오후 형식)
  - 날짜 구분선
  - 타이핑 인디케이터 (점 3개 애니메이션)
  - 이전 메시지 페이징 (스크롤 시 최대 50개)

---

#### 6.9 리뷰 (Review)
*UI 참조: `ui/8. 음식점 리뷰페이지.png`*

**6.9.1 리뷰 작성**
- 배달 완료 후 해당 음식점에 대한 리뷰 작성 (선택)
- **별점 (1~5점)** 선택 필수
- 텍스트 후기 작성 (선택)
- **이미지 첨부** (선택, 최대 3장, MinIO 업로드)
- 리뷰 항목 체크리스트 (선택):
  - "맛이 좋아요" / "양이 많아요" / "배달이 빨라요" / "포장이 꼼꼼해요" / "재주문 의사 있어요"
- **자기 가게 리뷰 방지:** OWNER가 자신의 음식점에 리뷰 작성 불가 (서버 검증)

**6.9.2 리뷰 목록 페이지**
- **별점 분포 차트:** 1~5점 각 몇 개인지 막대 그래프로 시각화
- **사장님 공지:** 음식점 사장이 등록한 공지 상단 고정 표시
- 최신순 정렬 (기본)
- **사진 리뷰만 보기** 필터 토글
- 리뷰 카드: 닉네임, 별점, 작성일, 리뷰 내용, 첨부 이미지, **신고하기** 버튼
- 평균 별점 및 총 리뷰 수 표시

**6.9.3 사장 답글 (NEW)**
- OWNER는 자신의 음식점에 달린 리뷰에 **답글 1개** 작성 가능
- 답글 수정 가능, 삭제 가능
- 리뷰 카드 하단에 "사장님 답글" 영역으로 표시

---

#### 6.10 마이페이지 (My Page)
*UI 참조: `ui/4.마이페이지.png`*

**6.10.1 프로필 섹션**
- 내 프로필 사진, 닉네임
- '프로필 수정' 버튼

**6.10.2 주문 내역**
*UI 참조: `ui/5.주문내역.png`*
- 탭 구분: [배달중] [완료]
- 필터: 조회 기간, 주문 상태
- 주문 카드: 날짜, 음식점명, 주문 항목, 결제금액
- 완료된 주문에서 **같은 메뉴 담기** / **바로 주문** 재주문 버튼 제공
- 완료된 주문에서 **리뷰 작성** 버튼 제공

**6.10.3 관심 음식점 (찜)**
*UI 참조: `ui/2.찜목록페이지.png`*
- 하트 누른 음식점 모아보기
- 리스트: 음식점명, 평점, 최소 주문금액, 배달 가능 여부

**6.10.4 리뷰 관리**
- 내가 작성한 리뷰 목록
- 리뷰 수정 / 삭제 가능

**6.10.5 주소 관리**
- 저장된 배달 주소 목록
- 주소 추가 / 수정 / 삭제
- 기본 배달 주소 설정

**6.10.6 음식점 등록 신청 (사장님 전용)**
- 마이페이지 하단에 "음식점 등록하기" 버튼 표시 (role == USER에게만 노출)
- 버튼 클릭 → 음식점 정보 입력 폼으로 이동

**6.10.7 배달기사 등록 신청 (NEW)**
- 마이페이지 하단에 "배달기사 등록하기" 버튼 표시 (role == USER에게만 노출)
- 버튼 클릭 → 기사 정보 입력 폼으로 이동
- 등록 완료 시 `User.role` = RIDER로 변경

---

### [P0: 필수 구현 — 음식점 사장 기능]

#### 6.11 음식점 등록
- 음식점명, 카테고리, 대표 사진 업로드
- 최소 주문금액, 배달비, 예상 배달 시간 입력
- 영업시간 설정
- **음식점 위치 입력:**
  - 카카오 우편번호 서비스로 주소 검색 → 도로명/지번 주소 선택
  - 선택된 주소의 위도/경도 자동 변환 후 저장
  - 지도 핀으로 위치 확인 가능
- 등록 후 관리자 승인 없이 즉시 노출

#### 6.12 주문 관리
- 신규 주문 목록 실시간 수신 (WebSocket)
- **주문 상태 변경:**
  - 접수 (PENDING → COOKING)
  - **배달 요청** (COOKING → WAITING_RIDER) — 근처 기사에게 브로드캐스트
  - **거절** (PENDING → CANCELLED, 사유 필수)
- 주문 상세: 메뉴 목록, 수량, **선택 옵션**, 고객 주소
- **배달 매칭 상태 표시:** 기사 찾는 중 / 기사 배정됨 (기사 정보 표시)
- 주문 취소 시 사유 선택: 재료 소진 / 영업시간 종료 / 주문 폭주 / 기타

#### 6.13 메뉴 관리
- 메뉴 등록: 이름, 카테고리, 가격, 설명, 이미지 업로드
- **메뉴 옵션 관리 (NEW):**
  - 옵션 그룹 추가/수정/삭제 (그룹명, 필수 여부, 최대 선택 수)
  - 옵션 항목 추가/수정/삭제 (옵션명, 추가 가격)
- 메뉴 수정 / 삭제
- 메뉴 품절 처리 (ON/OFF)

---

### [P0: 필수 구현 — 배달기사 기능 (NEW)]

#### 6.14 배달기사 등록
- 이동 수단 선택 (도보 / 자전거 / 오토바이 / 자동차)
- 활동 지역 설정 (주소 검색 → 반경 설정)
- 등록 완료 → `role` = RIDER

#### 6.15 배달 대기 화면
- **온라인/오프라인 토글** (상단 고정)
  - 온라인: 위치 전송 시작 (5초 간격), 배달 요청 수신
  - 오프라인: 위치 전송 중단, 배달 요청 수신 안 함
- **현재 위치 지도 표시** (카카오 맵)
- **기사는 한 번에 1건의 배달만 수행 가능** (배달 중에는 새 요청 수신 안 함)
- **배달 요청 카드 (수신 시):**
  - 가게명, 가게 위치, 고객 위치, 예상 거리, 예상 배달비
  - **수락 / 거절** 버튼
  - 수락 제한시간: 30초 (초과 시 자동 거절)
- **배달 매칭 알고리즘:**
  1. 가게 반경 3km 내 온라인 + 미배달 중인 기사에게 **동시 브로드캐스트** (선착순 수락)
  2. 30초 내 수락 없음 → 반경 5km로 확장하여 2차 브로드캐스트
  3. 2차에도 수락 없음 → 사장에게 "기사 매칭 실패" 알림, WAITING_RIDER → COOKING 롤백 (재요청 가능)
- **오늘 배달 통계:** 완료 건수, 총 수익

#### 6.16 배달 진행 화면
- **현재 배달 상태 표시:**
  - 가게로 이동 중 → 가게 위치 네비게이션
  - **'가게 도착' 버튼** → Delivery.status = AT_STORE
  - 음식 수령 후 **'픽업 완료' 버튼** → Order.status = PICKED_UP
  - 고객 위치로 이동 중 → 고객 위치 네비게이션
  - **'배달 완료' 버튼** → Order.status = DONE
- **고객/가게 정보:** 주소, 상세주소 표시
- **주문 상세:** 메뉴 목록 (수령 확인용)

#### 6.17 배달 내역
- 완료된 배달 목록 (날짜별)
- 배달 카드: 날짜, 가게명, 고객 주소, 거리, 배달비
- **수익 요약:** 일별 / 주별 / 월별 총 수익

---

### [P1: 관리자 페이지 (Admin Dashboard)]
*접근 제어: `User.role == 'ADMIN'` 인 계정만 접근 가능*

#### 6.18 대시보드 (Dashboard Overview)

**1) 주요 지표 (KPI Cards)**
- **DAU (일간 활성 사용자):** 오늘 접속한 순 사용자 수
- **신규 가입자 수:** 오늘 가입한 회원 수 (전일 대비 증감률)
- **신규 주문 수:** 오늘 접수된 주문 수 (전일 대비 증감률)
- **배달 완료 수:** 오늘 `status`가 `DONE`으로 변경된 주문 수
- **활성 배달기사 수 (NEW):** 현재 온라인 상태인 기사 수
- **평균 배달 시간 (NEW):** 픽업 → 완료까지 평균 소요 시간
- **신고 대기 건수:** `Report.status == 'PENDING'` 인 건수 **(Red Badge)**

#### 6.19 사용자 관리 (User Management)

**1) 유저 리스트 (Table)**
- 컬럼: 닉네임 | 이메일 | 역할 | 가입일 | 상태(활동중/정지/탈퇴) | 신고 받은 횟수
- **역할별 필터 (NEW):** USER / OWNER / RIDER / ADMIN
- 검색 (닉네임/이메일)

**2) 회원 상세 정보**
- 기본 정보, 접속 환경(IP, UA), 주문 내역
- **RIDER인 경우:** 배달 내역, 총 배달 건수, 평균 배달 시간

**3) 제재(Penalty) 처리**
- 정상 / 이용 정지(3일, 7일, 30일) / 영구 차단
- 제재 사유 기록

#### 6.20 신고 및 콘텐츠 관리 (Moderation)

**1) 신고 접수 리스트**
- 처리 대기중(PENDING) 신고만 최신순 노출
- 컬럼: 신고자 | 신고 대상(유저/음식점/메뉴) | 신고 사유 | 접수 일시 | 처리 상태

**2) 신고 처리 상세 뷰**
- 처리 액션: 기각(Reject) / 음식점·메뉴 숨김(Hide) / 회원 정지(Ban)
- **처리 결과 알림 (NEW):** 신고한 사용자에게 처리 결과 시스템 메시지 전송

**3) 음식점/메뉴 검색 및 조회**
- 필터: 키워드, 카테고리, 지역, 상태
- 리스트: 썸네일, 음식점명, 사장 정보, 신고 누적 횟수

#### 6.21 배달기사 관리 (NEW)

**1) 기사 리스트**
- 컬럼: 닉네임 | 이동수단 | 상태(온라인/오프라인) | 총 배달 건수 | 평균 배달 시간
- 활성/비활성 필터

**2) 기사 상세**
- 배달 내역, 고객 평가 (추후), 제재 이력

**3) 배달 현황 모니터링**
- 실시간 배달 건수, 매칭 대기 건수, 평균 매칭 시간


## 7. 데이터베이스 스키마 (Prisma)

```prisma
// schema.prisma

enum Role {
  USER
  OWNER     // 음식점 사장
  RIDER     // 배달기사 (NEW)
  ADMIN
}

enum UserStatus {
  ACTIVE
  BANNED
  WITHDRAWN
}

enum OrderStatus {
  PENDING        // 주문 접수
  COOKING        // 조리중
  WAITING_RIDER  // 배달기사 매칭 대기 (NEW)
  RIDER_ASSIGNED // 기사 배정됨 (NEW)
  PICKED_UP      // 픽업 완료 (배달 중)
  DONE           // 배달 완료
  CANCELLED      // 취소
}

enum DeliveryStatus {
  REQUESTED      // 배달 요청됨
  ACCEPTED       // 기사 수락
  AT_STORE       // 기사 가게 도착
  PICKED_UP      // 픽업 완료
  DELIVERING     // 배달 중
  DONE           // 배달 완료
  CANCELLED      // 취소
}

enum ReportStatus {
  PENDING
  RESOLVED
  REJECTED
}

enum RestaurantCategory {
  KOREAN      // 한식
  CHINESE     // 중식
  JAPANESE    // 일식
  CHICKEN     // 치킨
  PIZZA       // 피자
  BUNSIK      // 분식
  JOKBAL      // 족발·보쌈
  CAFE        // 카페·디저트
  FASTFOOD    // 패스트푸드
  JJAMBBONG   // 짬·탕
  RICE_BOWL   // 한그릇
  ETC         // 기타
}

enum ReportTarget {
  USER
  RESTAURANT
  MENU
  CHAT
}

enum TransportType {
  WALK        // 도보
  BICYCLE     // 자전거
  MOTORCYCLE  // 오토바이
  CAR         // 자동차
}

// ─── User ───

model User {
  id             String      @id @default(uuid())
  email          String      @unique
  nickname       String
  image          String?
  defaultAddress String?
  latitude       Float?
  longitude      Float?

  role           Role        @default(USER)
  status         UserStatus  @default(ACTIVE)
  bannedAt       DateTime?

  orders         Order[]
  favorites      FavoriteRestaurant[]
  reviews        Review[]
  sentMessages   Message[]
  chats          Chat[]

  sentReports    Report[]    @relation("Reporter")
  receivedReports Report[]   @relation("ReportedUser")

  restaurant     Restaurant? // OWNER인 경우
  addresses      UserAddress[]

  // RIDER 관련 (NEW)
  riderProfile   RiderProfile?
  deliveries     Delivery[]  @relation("RiderDeliveries")
  riderLocation  RiderLocation?

  createdAt      DateTime    @default(now())
}

model UserAddress {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  label     String   // "집", "회사" 등
  address   String
  detail    String?
  latitude  Float
  longitude Float
  isDefault Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ─── Restaurant ───

model Restaurant {
  id               String              @id @default(uuid())
  ownerId          String              @unique
  owner            User                @relation(fields: [ownerId], references: [id])

  name             String
  category         RestaurantCategory
  address          String              // 음식점 주소 텍스트
  imageUrl         String?
  description      String?
  notice           String?             // 사장님 공지 (리뷰 페이지 상단 고정)
  minOrderAmount   Int
  deliveryFee      Int
  deliveryTime     Int                 // 예상 배달 시간 (분)
  isOpen           Boolean             @default(true)
  openTime         String?             // "09:00" (요일 구분 없이 단일 영업시간)
  closeTime        String?             // "22:00"

  latitude         Float
  longitude        Float

  menus            Menu[]
  orders           Order[]
  reviews          Review[]
  favorites        FavoriteRestaurant[]
  reports          Report[]

  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  // NOTE: Prisma @@index는 B-Tree. PostGIS GiST 인덱스는 raw SQL migration으로 별도 생성 필요:
  // CREATE INDEX idx_restaurant_geo ON "Restaurant" USING GIST (ST_MakePoint(longitude, latitude));
  @@index([latitude, longitude])
}

// ─── Menu & Options ───

model Menu {
  id           String             @id @default(uuid())
  restaurantId String
  restaurant   Restaurant         @relation(fields: [restaurantId], references: [id])

  name         String
  price        Int
  description  String?
  imageUrl     String?
  category     String             // 사장이 자유 입력하는 메뉴 카테고리
  isSoldOut    Boolean            @default(false)
  isPopular    Boolean            @default(false)
  isNew        Boolean            @default(false)

  optionGroups MenuOptionGroup[]  // NEW
  orderItems   OrderItem[]
  reports      Report[]

  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
}

model MenuOptionGroup {
  id           String       @id @default(uuid())
  menuId       String
  menu         Menu         @relation(fields: [menuId], references: [id], onDelete: Cascade)

  name         String       // "사이즈 선택", "토핑 추가"
  isRequired   Boolean      @default(false)
  maxSelect    Int          @default(1) // 최대 선택 수
  sortOrder    Int          @default(0)

  options      MenuOption[]

  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model MenuOption {
  id           String          @id @default(uuid())
  groupId      String
  group        MenuOptionGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)

  name         String          // "레귤러", "라지", "치즈 추가"
  extraPrice   Int             @default(0) // 추가 가격
  sortOrder    Int             @default(0)

  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

// ─── Order ───

model Order {
  id              String      @id @default(uuid())
  userId          String
  restaurantId    String

  user            User        @relation(fields: [userId], references: [id])
  restaurant      Restaurant  @relation(fields: [restaurantId], references: [id])

  status          OrderStatus @default(PENDING)
  totalPrice      Int
  deliveryFee     Int              // 주문 시점 배달비 스냅샷 (고객 부담)
  deliveryAddress String
  deliveryLat     Float            // 배달 좌표 (non-nullable)
  deliveryLng     Float
  deliveryNote    String?          // 배달 요청사항 ("문 앞에 놓아주세요" 등)

  cancelReason    String?          // 취소 사유
  cancelledBy     String?          // 취소 주체 (userId)

  items           OrderItem[]
  review          Review?
  chat            Chat?
  delivery        Delivery?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model OrderItem {
  id              String @id @default(uuid())
  orderId         String
  menuId          String
  quantity        Int
  price           Int    // 주문 시점 메뉴 기본 가격
  selectedOptions Json?  // NEW: 선택한 옵션 스냅샷 [{groupName, optionName, extraPrice}]
  optionPrice     Int    @default(0) // NEW: 옵션 추가 금액 합계

  order           Order  @relation(fields: [orderId], references: [id])
  menu            Menu   @relation(fields: [menuId], references: [id])
}

// ─── Delivery (NEW) ───

model Delivery {
  id             String         @id @default(uuid())
  orderId        String         @unique
  order          Order          @relation(fields: [orderId], references: [id])

  riderId        String?        // 수락 전에는 null
  rider          User?          @relation("RiderDeliveries", fields: [riderId], references: [id])

  status         DeliveryStatus @default(REQUESTED)

  pickupLat      Float          // 가게 위치
  pickupLng      Float
  dropoffLat     Float          // 고객 위치
  dropoffLng     Float

  distance       Float?         // 배달 거리 (km)
  estimatedTime  Int?           // 예상 배달 시간 (분)
  riderFee       Int            // 기사 배달 수수료 (플랫폼 → 기사 지급액)

  acceptedAt     DateTime?
  pickedUpAt     DateTime?
  completedAt    DateTime?

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

model RiderProfile {
  id             String        @id @default(uuid())
  userId         String        @unique
  user           User          @relation(fields: [userId], references: [id])

  transportType  TransportType
  activityArea   String?       // 활동 지역 주소
  activityLat    Float?
  activityLng    Float?
  activityRadius Float         @default(5) // 활동 반경 (km)

  totalDeliveries Int          @default(0)
  totalEarnings   Int          @default(0)

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model RiderLocation {
  userId    String   @id
  user      User     @relation(fields: [userId], references: [id])

  latitude  Float
  longitude Float
  isOnline  Boolean  @default(false)

  updatedAt DateTime @updatedAt
}

// ─── Social ───

model FavoriteRestaurant {
  userId       String
  restaurantId String
  user         User       @relation(fields: [userId], references: [id])
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  createdAt    DateTime   @default(now())

  @@id([userId, restaurantId])
}

model Review {
  id           String     @id @default(uuid())
  userId       String
  restaurantId String
  orderId      String     @unique

  rating       Int        // 1~5
  content      String?
  tags         String[]   // 선택한 체크리스트 항목
  imageUrls    String[]   // NEW: 리뷰 이미지 (최대 3장)

  ownerReply   String?    // NEW: 사장 답글
  ownerRepliedAt DateTime? // NEW

  user         User       @relation(fields: [userId], references: [id])
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  order        Order      @relation(fields: [orderId], references: [id])

  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

// ─── Chat ───

model Chat {
  id       String    @id @default(uuid())
  orderId  String?   @unique  // nullable (일반 문의 지원)
  userId   String
  adminId  String?            // 담당 관리자 (고객센터 응답자)

  order    Order?    @relation(fields: [orderId], references: [id])
  user     User      @relation(fields: [userId], references: [id])

  messages Message[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Message {
  id        String   @id @default(uuid())
  chatId    String
  senderId  String

  type      String   @default("TEXT") // TEXT, IMAGE, SYSTEM
  content   String

  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  chat      Chat     @relation(fields: [chatId], references: [id])
  sender    User     @relation(fields: [senderId], references: [id])
}

// ─── Report ───

model Report {
  id                 String       @id @default(uuid())

  reporterId         String
  reporter           User         @relation("Reporter", fields: [reporterId], references: [id])

  targetType         ReportTarget

  targetUserId       String?
  targetUser         User?        @relation("ReportedUser", fields: [targetUserId], references: [id])

  targetRestaurantId String?
  targetRestaurant   Restaurant?  @relation(fields: [targetRestaurantId], references: [id])

  targetMenuId       String?
  targetMenu         Menu?        @relation(fields: [targetMenuId], references: [id])

  reason             String
  description        String?

  status             ReportStatus @default(PENDING)
  adminMemo          String?

  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
}
```


## 8. 기타 고려사항

### 8.1 최적화 및 보안
- **이미지 최적화:** 클라이언트에서 이미지 리사이징 및 WebP 압축 후 Presigned URL로 MinIO 직접 업로드
- **CDN:** MinIO 앞단에 CDN 배치 → 이미지 로딩 < 1초
- **채팅 보안:** WebSocket 연결 시 HTTP 헤더의 JWT 토큰 유효성 필수 검증
- **위치 정보:** PostGIS 공간 인덱스 활용 → 반경 검색 O(log n)
- **Rate Limiting:** Redis 기반 — 주문: 분당 5회, 검색: 분당 30회, 위치 업데이트: 5초 간격

### 8.2 캐싱 전략
| 대상 | 저장소 | TTL | 무효화 조건 |
|------|--------|-----|------------|
| 음식점 목록 (반경 검색 결과) | Redis | 5분 | 음식점 등록/수정/삭제 시 |
| 메뉴 데이터 | Redis | 10분 | 메뉴 수정/품절 처리 시 |
| 사용자 세션 | JWT | - | 토큰 만료 시 |
| 배달기사 위치 | Redis GEO | 실시간 | 5초 간격 갱신 |

### 8.3 성능 요구사항 (NEW)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| API 응답시간 (p95) | < 500ms | 서버 로그 분석 |
| 반경 검색 (음식점 1만개) | < 200ms | PostGIS 공간 인덱스 |
| WebSocket 동시접속 | 1만명+ | Socket.IO Redis Adapter |
| 이미지 로딩 | < 1초 | CDN + WebP |
| 배달기사 위치 지연 | < 1초 | Redis GEO + WebSocket |
| DB 커넥션 | 200+ 동시 | PgBouncer |
| 배달 매칭 시간 | < 30초 | Redis GEORADIUS |

### 8.4 테스트 전략
- **Mock Auth Provider:** 테스트 환경에서 가짜 인증으로 로그인 우회
- **핵심 시나리오 E2E (Playwright):**
  - 음식점 탐색 → 메뉴 선택 → 옵션 선택 → 주문 확정 → 사장 접수 → 배달 요청 → 기사 수락 → 배달 완료 → 리뷰 작성
  - 주문 취소 시나리오 (고객 취소, 사장 거절)
- **단위 테스트 (Vitest):**
  - 장바구니 로직 (옵션 가격 계산, 품절 검증)
  - 주문 상태 전이 규칙 (State Machine)
  - 배달 거리/시간 계산


## 환경 변수 (.env.example)

```env
# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bdelivery"
DATABASE_READ_URL="postgresql://user:password@localhost:5433/bdelivery"   # NEW: Read Replica

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="YOUR_MINIO_ACCESS_KEY"
MINIO_SECRET_KEY="YOUR_MINIO_SECRET_KEY"
MINIO_BUCKET_NAME="bdelivery"
MINIO_CDN_URL="https://cdn.bdelivery.com"   # NEW: CDN URL

# Kakao Map API
NEXT_PUBLIC_KAKAO_MAP_KEY="your-kakao-map-js-key"

# Chat Server
CHAT_SERVER_URL="http://localhost:8080"

# Delivery (NEW)
DELIVERY_REQUEST_TIMEOUT_SEC=30              # 배달 요청 수락 제한시간
DELIVERY_SEARCH_RADIUS_KM=3                  # 기사 검색 반경
RIDER_LOCATION_UPDATE_INTERVAL_MS=5000       # 기사 위치 갱신 간격
```
