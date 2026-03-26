# Bug Report: 주소 변경 후 홈 화면 미반영

- **발견일**: 2026-03-26
- **심각도**: High
- **상태**: 해결 완료

## 증상

주소 관리 페이지에서 기본 배달 주소를 변경한 후 홈 화면으로 돌아가면 **이전 주소**가 그대로 표시됨. 재로그인해야만 변경된 주소가 반영됨.

## 발생 원인

### 1차 원인: JWT 세션 의존

홈 페이지(`page.tsx`)가 Server Component에서 `auth()`를 호출하여 **JWT 토큰에 저장된 주소**를 읽고 있었음.

```tsx
// 기존 코드 — JWT에서 주소를 읽음
const session = await auth();
const latitude = session?.user?.latitude;
const longitude = session?.user?.longitude;
// ...
<HomeHeader address={session?.user?.defaultAddress ?? null} />
```

JWT 토큰은 로그인 시점(`trigger === "signIn"`) 또는 `update` 트리거 시에만 DB에서 최신 정보를 가져오도록 설계되어 있어, DB가 업데이트되어도 JWT에는 이전 값이 남아있었음.

### 2차 원인: `useSession().update()` 400 에러

클라이언트에서 `useSession().update()`를 호출하여 JWT를 갱신하려 했으나, NextAuth v5에서 CSRF 토큰 처리 문제로 **400 Bad Request** 에러가 발생하면서 세션 갱신이 실패함.

```
// 콘솔 에러
Failed to load resource: the server responded with a status of 400 (Bad Request)
```

검증 결과, CSRF 토큰을 수동으로 포함해서 POST 요청을 보내면 정상적으로 세션이 갱신됨:

```js
// CSRF 토큰 포함 시 정상 동작
fetch('/api/auth/csrf')
  .then(r => r.json())
  .then(csrf => fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csrfToken: csrf.csrfToken })
  }))
```

### 영향 범위

| 위치 | 영향 |
|------|------|
| 홈 화면 헤더 주소 표시 | 이전 주소가 표시됨 |
| 홈 화면 음식점 목록 | 이전 좌표 기준으로 음식점 필터링 |

## 시도한 접근 (실패)

| 시도 | 결과 |
|------|------|
| `address-card.tsx`에 `router.refresh()` 추가 | 현재 페이지만 새로고침되고 홈에는 영향 없음 |
| `HomeHeader`에서 `useSession()`으로 직접 읽기 | `update()` 400 에러로 세션 갱신 안됨 |
| `useEffect(() => update(), [update])` | `update`가 매번 새 참조를 반환하여 무한 루프 발생 |
| `useEffect(() => update(), [])` | `update()` 자체가 400 에러로 실패 |

## 해결 방법

**JWT 세션 대신 DB에서 직접 주소를 조회**하도록 변경.

### 수정 파일

#### `src/app/(customer)/page.tsx`

```tsx
// 변경 후 — DB에서 직접 주소 조회
const session = await auth();

let address: string | null = null;
let latitude: number | null = null;
let longitude: number | null = null;

if (session?.user?.id) {
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultAddress: true, latitude: true, longitude: true },
  });
  if (dbUser) {
    address = dbUser.defaultAddress;
    latitude = dbUser.latitude;
    longitude = dbUser.longitude;
  }
}
// ...
<HomeHeader address={address} />
```

#### `src/app/(customer)/_components/home-header.tsx`

```tsx
// useSession() 제거, props로 주소 수신 (원래 방식 유지)
interface HomeHeaderProps {
  address: string | null;
}
export function HomeHeader({ address }: HomeHeaderProps) { ... }
```

### 동작 원리

1. 주소 변경 Server Action이 DB 업데이트 후 `revalidatePath("/")` 호출
2. Next.js가 홈 페이지의 Full Route Cache + Router Cache 무효화
3. 다음 홈 방문 시 Server Component가 재실행되어 DB에서 최신 주소 조회

## 검증

Playwright E2E 테스트로 검증 완료:

1. 테스트 계정 로그인 → 홈 화면 주소 확인
2. DB에서 주소 직접 변경
3. 전체 페이지 로드(navigate) → 즉시 반영 확인
4. 클라이언트 사이드 네비게이션(BottomNav 탭 클릭) → 즉시 반영 확인

## 잔여 사항

- `useSession().update()`의 CSRF 400 에러는 NextAuth v5의 알려진 이슈일 수 있음. 주소 외 다른 곳에서 세션 갱신이 필요한 경우 동일 문제 발생 가능.
- 현재 `address-card.tsx`의 `updateSession()` 호출은 실질적으로 동작하지 않으나, `revalidatePath`로 캐시 무효화가 되므로 기능상 문제 없음.
