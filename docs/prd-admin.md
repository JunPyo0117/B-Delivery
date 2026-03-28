# B-Delivery PRD — 관리자 (ADMIN) + 채팅 시스템
> 원본: `prd-v2.md` 에서 관리자 기능 + 채팅 공통 시스템 추출. 공통 기반(스키마, 인프라)은 1단계에서 완료된 상태를 전제.

## 담당 범위

| 라우트 그룹 | 설명 |
|------------|------|
| `src/app/(admin)/` | 관리자 전용 페이지 |
| 채팅 공통 컴포넌트 | 채팅방 UI, 채팅 목록 등 (고객/사장/기사가 가져다 쓸 공통 컴포넌트) |

**레이아웃:** PC 전용, 좌측 사이드바 네비게이션

## 의존하는 공통 기반 (1단계에서 완료)
- Prisma 스키마 전체
- NextAuth 인증 + ADMIN 역할 체크
- Centrifugo 설정 + Proxy API
- Docker Compose

---

## 채팅 시스템 (이 에이전트가 전담)

> **핵심:** ADMIN이 고객·사장·기사 모든 소통의 허브. 채팅 공통 컴포넌트를 이 에이전트가 만들고, 나머지 3개 에이전트는 진입점(버튼)만 만듦.

### 6.8 채팅 — 고객센터 허브 모델

**채팅 구조:**
```
고객 (USER)  ↔  ADMIN (고객센터)  ↔  사장 (OWNER)
                     ↕
               기사 (RIDER)
```

**ChatType enum:**
- `CUSTOMER_SUPPORT`: 고객 ↔ ADMIN
- `OWNER_SUPPORT`: 사장 ↔ ADMIN
- `RIDER_SUPPORT`: 기사 ↔ ADMIN

**ChatStatus enum:**
- `WAITING`: 상담 대기 (미배정/미응답)
- `IN_PROGRESS`: 상담 진행 중
- `CLOSED`: 상담 완료

**상담원 배정:** 채팅방 생성 시 대기 중인 ADMIN 자동 배정 → Chat.adminId
**ADMIN 부재:** 시스템 메시지 "현재 상담 대기 중입니다."

### 6.8.6 채팅방 공통 UI (모든 역할이 사용)

이 에이전트가 만들 **공통 컴포넌트:**
- `ChatRoomComponent` — 채팅방 메인 UI
- `ChatListComponent` — 채팅 목록 UI
- `ChatInputComponent` — 메시지 입력 (텍스트 + 이미지)
- `MessageBubbleComponent` — 메시지 버블
- `TypingIndicator` — 타이핑 표시
- `DateSeparator` — 날짜 구분선

**기능:**
- Centrifugo WebSocket (`chat:<chatId>` 채널)
- 텍스트: Enter 전송, Shift+Enter 줄바꿈
- 이미지: image/* 5MB, MinIO Presigned URL
- 시스템 메시지 (SYSTEM)
- 읽음 확인 (숫자 1 → 읽으면 사라짐)
- 타이핑 인디케이터
- 날짜 구분선
- 이전 메시지 페이징 (50개)
- Optimistic Update (pending → confirmed)

### 6.8.2 고객 채팅 진입 (참고 — 고객 에이전트가 진입점 제공)
- 주문 선택 → CUSTOMER_SUPPORT 채팅 생성
- "주문 말고 다른 문의" → orderId 없이 생성
- 카테고리: 주문/배달/결제/기타

### 6.8.3 사장 채팅 진입 (참고 — 사장 에이전트가 진입점 제공)
- 사이드바 채팅 메뉴 → OWNER_SUPPORT 생성
- 주문 관련 / 운영 관련

### 6.8.4 기사 채팅 진입 (참고 — 기사 에이전트가 진입점 제공)
- 마이페이지 고객센터 버튼 → RIDER_SUPPORT 생성
- 배달 관련 / 계정 관련

---

## 관리자 기능

### 6.18 대시보드 (KPI)
- **DAU:** 오늘 접속 순 사용자 수
- **신규 가입자:** 오늘 가입 (전일 대비 증감률)
- **신규 주문:** 오늘 접수 (전일 대비 증감률)
- **배달 완료:** 오늘 DONE 건수
- **활성 배달기사:** 현재 온라인 기사 수
- **평균 배달 시간:** 픽업 → 완료 평균
- **신고 대기:** Report.status == PENDING (Red Badge)

### 6.19 사용자 관리

**유저 리스트:**
- 닉네임 | 이메일 | 역할 | 가입일 | 상태 | 신고 횟수
- 역할별 필터: USER / OWNER / RIDER / ADMIN
- 닉네임/이메일 검색

**회원 상세:**
- 기본 정보, 접속 환경, 주문 내역
- RIDER: 배달 내역, 총 건수, 평균 시간

**제재:**
- 정상 / 이용 정지 (3일/7일/30일) / 영구 차단
- 제재 사유 기록

### 6.20 신고 및 콘텐츠 관리

**신고 리스트:**
- PENDING만 최신순
- 신고자 | 대상 | 사유 | 접수일 | 상태

**처리:**
- 기각 / 숨김 / 차단
- 처리 결과 시스템 메시지 전송

**음식점/메뉴 조회:**
- 키워드, 카테고리, 지역 필터
- 신고 누적 항목 상단 노출

### 6.21 배달기사 관리

**기사 리스트:**
- 닉네임 | 이동수단 | 온라인/오프라인 | 총 배달 건수 | 평균 시간
- 활성/비활성 필터

**기사 상세:**
- 배달 내역, 고객 평가 (추후), 제재 이력

**배달 현황 모니터링:**
- 실시간 배달 건수, 매칭 대기 건수, 평균 매칭 시간

### 6.22 고객센터 상담 화면 (핵심)

**PC 전용 3패널 레이아웃:**
```
┌────────────┬───────────────────────────┬─────────────────────────┐
│  채팅 리스트  │      채팅방 (대화 영역)      │    상담 정보 패널        │
│ (300px)    │      (메인 영역)            │    (320px)              │
│            │                           │                         │
│ 🔴 대기(3)  │  [시스템] 주문 #1234 관련    │  👤 상대방 정보          │
│ 💬 진행(5)  │  문의가 접수되었습니다.       │  📦 연결된 주문          │
│ ✅ 완료     │                           │  🔧 빠른 액션            │
│            │  고객: 배달이 안 왔어요       │                         │
│ [김철수] 🔴 │  나: 확인해보겠습니다.       │  [사장에게 문의 열기]      │
│ [교촌치킨]  │                           │  [기사에게 문의 열기]      │
│ [박배달]    │                           │  [주문 강제 취소]         │
│            │                           │  [환불 처리]             │
└────────────┴───────────────────────────┴─────────────────────────┘
```

**1) 채팅 리스트 (좌측, 300px):**
- 탭: 대기 | 진행 중 | 완료
- 유형 필터: 전체 / 고객 / 사장 / 기사
- 역할 뱃지, 마지막 메시지, 경과 시간
- 대기 건수 빨간 뱃지, 대기 오래된 순 정렬

**2) 채팅방 (중앙):**
- 공통 채팅 UI (6.8.6)
- 상단 배너: 유형 + 주문번호
- 상담 상태 변경: 진행 중 → 완료

**3) 상담 정보 패널 (우측, 320px):**
- 상대방 정보: 닉네임, 역할, 가입일, 총 주문/배달 건수
- 연결된 주문: 번호, 상태, 음식점, 메뉴, 금액, 기사, 타임라인
- **빠른 액션:**
  - [사장에게 문의 열기] → OWNER_SUPPORT 채팅 생성 (주문 자동 연결)
  - [기사에게 문의 열기] → RIDER_SUPPORT 채팅 생성 (주문 자동 연결)
  - [주문 강제 취소] → 관리자 권한 취소
  - [환불 처리] → 사유 입력 (MVP: 상태만 기록)
- 이전 상담 이력 (같은 사용자, 최근 5건)

**4) 알림:**
- 새 채팅: 브라우저 알림 + 알림음
- 대기 5분 초과: 경고 표시

---

## Centrifugo 채널 (ADMIN이 구독)

| 채널 | 용도 | 구독 방식 |
|------|------|----------|
| `user#<adminId>` | 새 채팅 알림, 대기 건수 업데이트 | Connect Proxy (서버 사이드) |
| `chat:<chatId>` | 현재 열린 채팅방 메시지 | Subscribe (채팅 선택 시) |

## 관련 DB 모델

**채팅:**
Chat (ChatType, ChatStatus, adminId), Message

**관리자:**
User, Restaurant, Menu, Order, Delivery, RiderProfile, Report

## Chat DB 스키마 (참고)

```prisma
enum ChatType {
  CUSTOMER_SUPPORT
  OWNER_SUPPORT
  RIDER_SUPPORT
}

enum ChatStatus {
  WAITING
  IN_PROGRESS
  CLOSED
}

model Chat {
  id         String     @id @default(uuid())
  chatType   ChatType
  status     ChatStatus @default(WAITING)
  orderId    String?
  userId     String
  adminId    String?
  category   String?
  order      Order?    @relation(fields: [orderId], references: [id])
  user       User      @relation(fields: [userId], references: [id])
  messages   Message[]
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```
