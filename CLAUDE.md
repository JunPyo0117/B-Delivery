# B-Delivery (비디릴버리)

위치 기반 음식 주문/배달 플랫폼 (배민 클론) — 10만 유저 규모 대응

## 절대 규칙
- 항상 한국어로 답변
- 모든 수정 사항/기능 개발/여러 파일 수정 → 워크트리에서 작업 후 스쿼시 머지 (`/merge-worktree`)
- 태스크 완료 후 상태 업데이트
- 새 기능은 반드시 Plan Mode에서 설계 후 구현
- Plan Mode로 작성한 md 파일 문서 이름은 태스크 번호 및 태스크 이름으로 작성
- Plan Mode로 작성한 md 파일 docs 폴더에 저장
- 한 세션에서 한 피처만 작업, 완료 후 /clear
- 에러 발생 시 에러 로그 전체를 분석할 것 (요약하지 말 것)
- UI 구현 시 반드시 `ui/` 폴더의 스크린샷을 참조
- PRD 원본: `prd-v2.md` — 기능명세, DB 스키마, 환경변수 정의 (v1: `prd.md`는 참고용)
- 발생한 모든 버그 사항 수

## 아키텍처

@docs/architecture.md

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Backend**: Next.js API Routes (Server Actions), NextAuth.js v5 (Google OAuth)
- **Chat Server**: Node.js (TypeScript + Socket.IO), Redis Adapter (수평 스케일링)
- **DB**: PostgreSQL + PostGIS (공간 인덱스) + Prisma ORM, PgBouncer (커넥션 풀)
- **Cache/Messaging**: Redis (Cache + Streams + GEO + Pub/Sub)
- **Storage**: MinIO (Presigned URL) + CDN (이미지 최적화)
- **Testing**: Vitest (단위 테스트), Playwright (E2E)
- **Infra**: Docker Compose (`bdelivery_net` 브리지 네트워크)

## 빌드 & 실행

- `docker compose up -d` — 전체 서비스 실행
- `npm run dev` — Next.js 개발 서버 (localhost:3000)
- `npx prisma migrate dev` — DB 마이그레이션
- `npx prisma generate` — Prisma 클라이언트 생성
- `npx prisma db seed` — 테스트 데이터 시드

## 프로젝트 구조 (FSD — Feature-Sliced Design)

```
src/
├── app/                      # Layer 0: 라우팅만 담당 (page.tsx → pages/ import)
│   ├── (auth)/               # 로그인
│   ├── (customer)/           # 고객 라우트
│   ├── (owner)/              # 사장 라우트
│   ├── (rider)/              # 배달기사 라우트
│   ├── (admin)/              # 관리자 라우트
│   └── api/                  # API Routes
│
├── pages/                    # Layer 1: 페이지 조합 (위젯을 조합하여 페이지 구성)
│   ├── home/
│   ├── restaurant-detail/
│   ├── cart/
│   ├── order-status/
│   ├── rider-dashboard/
│   └── ...
│
├── widgets/                  # Layer 2: 독립적 UI 블록 (자체 데이터 페칭)
│   ├── restaurant-card/
│   ├── order-status-tracker/
│   ├── chat-room/
│   ├── delivery-request-panel/
│   ├── rider-delivery-card/
│   └── bottom-navigation/
│
├── features/                 # Layer 3: 사용자 인터랙션 단위 (액션 + 상태)
│   ├── auth/                 # 로그인/인증
│   ├── cart/                 # 장바구니 (addItem, store, placeOrder)
│   ├── order/                # 주문 상태 관리
│   ├── chat/                 # 채팅 (socket, store, UI)
│   ├── review/               # 리뷰 작성/관리
│   ├── favorite/             # 찜
│   ├── delivery/             # 배달 요청/수락/매칭
│   ├── rider-location/       # 기사 위치 추적
│   ├── search/               # 검색
│   └── menu-option/          # 메뉴 옵션 선택
│
├── entities/                 # Layer 4: 비즈니스 엔티티 (UI + 타입 + API)
│   ├── restaurant/
│   ├── menu/
│   ├── order/
│   ├── user/
│   ├── rider/
│   ├── delivery/
│   ├── chat/
│   └── review/
│
├── shared/                   # Layer 5: 인프라, 공용 유틸
│   ├── api/                  # prisma, redis, minio 클라이언트
│   ├── config/               # 상수, 환경변수
│   ├── lib/                  # kakao, image-compress, cn
│   ├── ui/                   # shadcn/ui 컴포넌트
│   └── types/                # 글로벌 타입 (next-auth.d.ts 등)
│
└── generated/                # Prisma 자동 생성

chat-server/                  # Node.js 채팅 서버 (TypeScript + Socket.IO)
prisma/                       # Prisma 스키마 + 마이그레이션
ui/                           # 디자인 스크린샷 참조
```

### FSD 의존성 규칙

```
app → pages → widgets → features → entities → shared
         상위 레이어는 하위만 import 가능 (역방향 금지)
```

- `features/cart/`는 `entities/menu/` import 가능
- `entities/menu/`는 `features/cart/` import **불가**
- `shared/`는 어떤 상위 레이어도 import **불가**

### FSD 파일 네이밍

각 슬라이스(폴더) 내부 구조:
```
features/cart/
├── ui/                 # 컴포넌트 (AddToCartButton.tsx)
├── model/              # 상태, 훅 (cartStore.ts)
├── api/                # 서버 통신 (placeOrder.ts)
├── lib/                # 내부 유틸
└── index.ts            # Public API (re-export)
```

## 코딩 컨벤션

- 컴포넌트: PascalCase (`RestaurantCard.tsx`)
- 유틸/훅: camelCase (`useWebSocket.ts`)
- 슬라이스 외부 접근: 반드시 `index.ts`를 통한 re-export만 사용
- Server Actions: `src/app/api/` 또는 인라인 `"use server"`
- 상태관리: 서버 상태 → Server Components, 클라이언트 상태 → Zustand (features/*/model/)
- 이미지 업로드: 클라이언트 → Presigned URL → MinIO 직접 업로드
- 실시간 (주문 상태): Next.js API → Redis Stream → Chat Server → WebSocket → 클라이언트
- 실시간 (채팅): 클라이언트 → Socket.IO → Chat Server → PostgreSQL 저장 + Socket.IO 브로드캐스트
- 실시간 (기사 위치): RIDER 브라우저 → Socket.IO → Chat Server → Redis GEO → 고객 WebSocket 푸시
- 배달 매칭: Next.js API → Redis Stream → Chat Server → GEORADIUS로 근처 기사 검색 → 브로드캐스트

## 사용자 역할

| Role | 접근 가능 페이지 | 하단 네비 |
|------|-----------------|----------|
| USER | 홈, 음식점, 장바구니, 주문, 마이페이지, 채팅 | 홈 / 찜 / 주문내역 / 마이페이지 |
| OWNER | USER + 사장 대시보드 (주문관리, 메뉴관리, 배달요청) | 홈 / 주문관리 / 메뉴관리 / 마이페이지 |
| RIDER | 배달대기, 배달진행, 배달내역, 마이페이지 | 배달대기 / 배달내역 / 마이페이지 |
| ADMIN | USER + 관리자 대시보드 | 사이드바 (하단 탭 없음) |

> 역할은 1개만 보유 가능. OWNER/RIDER 등록은 `role == USER`일 때만 가능.

## UI 참조 파일

| 파일 | 화면 |
|------|------|
| `ui/1.메인페이지.png` | 홈 화면 |
| `ui/2.찜목록페이지.png` | 관심 음식점 |
| `ui/3.가게상세페이지.png` | 음식점 상세 |
| `ui/4.마이페이지.png` | 마이페이지 |
| `ui/5.주문내역.png` | 주문 내역 |
| `ui/6.가게 페이지.png` | 음식점 메뉴 탭 |
| `ui/8. 음식점 리뷰페이지.png` | 리뷰 목록 |
| `ui/9. 장바구니페이지.png` | 장바구니 |
| `ui/12. 상담 채팅 페이지.png` | 고객센터 채팅 |

## Skills

커스텀 검증 및 유지보수 스킬은 `.claude/skills/`에 정의되어 있습니다.

| Skill | Purpose |
|-------|---------|
| `verify-implementation` | 프로젝트의 모든 verify 스킬을 순차 실행하여 통합 검증 보고서를 생성합니다 |
| `manage-skills` | 세션 변경사항을 분석하고, 검증 스킬을 생성/업데이트하며, CLAUDE.md를 관리합니다 |
| `merge-worktree` | Worktree 브랜치를 타겟 브랜치로 Squash-merge합니다 |

## Commands

| Command | 용도 |
|---------|------|
| `/docs` | 라이브러리 문서 조회 (Context7) |
| `/ui` | shadcn/ui 컴포넌트 탐색 |
| `/browse` | Playwright 브라우저 자동화 |
| `/gh` | GitHub 이슈/PR 관리 |
| `/tm` | Taskmaster 태스크 관리 |

## Hooks

| Hook | 트리거 | 역할 |
|------|--------|------|
| `commit-session.sh` | Stop (세션 종료) | WIP 커밋 자동 생성 (비동기) |
| `load-recent-changes.sh` | SessionStart | 최근 CHANGELOG + git log 컨텍스트 로드 |

## 주문 상태 전이

```
PENDING → COOKING → WAITING_RIDER → RIDER_ASSIGNED → PICKED_UP → DONE
PENDING/COOKING → CANCELLED (고객/사장 취소)
RIDER_ASSIGNED → WAITING_RIDER (기사 취소 시 재매칭)
```

## 테스트 전략

- **핵심 비즈니스 로직**: TDD (Vitest) — 장바구니(옵션 가격), 주문 상태 전이(State Machine), 배달 거리/시간 계산
- **E2E**: Playwright — 주문 Full-Cycle (탐색→주문→사장접수→배달요청→기사수락→배달완료→리뷰)
- **수동 검증**: Taskmaster testStrategy 기반
