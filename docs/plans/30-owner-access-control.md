# Task #30: Owner 대시보드 접근 제어

## 개요
`/owner/*` 경로에 대해 OWNER 역할만 접근 가능하도록 제한하는 기능을 구현한다.

## 현황 분석
- Admin 접근 제어가 `src/app/(admin)/layout.tsx`에서 레이아웃 레벨로 구현됨
- `session.user.role`로 역할 확인 후 리다이렉트하는 패턴 사용 중
- NextAuth v5 세션에 `role` 필드가 이미 포함되어 있음 (`"USER" | "OWNER" | "ADMIN"`)

## 설계

### 접근 제어 방식
Admin과 동일한 패턴을 따라 **레이아웃 컴포넌트**에서 서버사이드 세션 검증을 수행한다.

#### `src/app/(owner)/layout.tsx`
- `auth()`로 세션 조회
- 비로그인 또는 `role !== "OWNER"` && `role !== "ADMIN"` → `/` 리다이렉트
- ADMIN은 OWNER 페이지 접근 허용 (상위 역할)

### Owner 레이아웃 구조
- 상단에 Owner 전용 네비게이션 (대시보드, 주문관리, 메뉴관리)
- 모바일 우선 반응형 디자인

### 스캐폴딩 페이지
- `/owner/dashboard` — 기본 대시보드 페이지

## 파일 목록
| 파일 | 작업 |
|------|------|
| `src/app/(owner)/layout.tsx` | 신규 - Owner 레이아웃 + 접근 제어 |
| `src/app/(owner)/_components/owner-nav.tsx` | 신규 - Owner 네비게이션 |
| `src/app/(owner)/owner/dashboard/page.tsx` | 신규 - 대시보드 페이지 |

## 테스트 전략
- 수동: USER 역할로 `/owner/dashboard` 접근 시 홈으로 리다이렉트 확인
- 수동: OWNER 역할로 접근 시 정상 렌더링 확인
- 수동: 비로그인 시 홈으로 리다이렉트 확인
