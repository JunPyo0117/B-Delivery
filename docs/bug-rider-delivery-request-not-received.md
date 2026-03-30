# 버그 리포트: 배달 기사에게 배달 요청이 수신되지 않는 문제

## 증상

사장이 배달 요청(COOKING → WAITING_RIDER)을 하면 Delivery 레코드가 생성되고 Redis Stream에 이벤트가 발행되지만, 배달 기사 대시보드에 배달 요청 카드가 표시되지 않음.

## 근본 원인 (3가지)

### 1. Redis GEO 미등록

Order Worker가 `GEORADIUS("rider:locations", ...)` 로 반경 3km 내 기사를 검색하는데, 기사 위치가 Redis GEO에 한 번도 등록되지 않아 `nearbyRiders = []` → 아무에게도 Centrifugo 발행이 안 됨.

| 함수 | 문제 |
|------|------|
| `toggleOnlineStatus()` | DB `RiderLocation.isOnline`만 토글하고 Redis GEO에 `GEOADD` 안 함 |
| `updateRiderLocation()` | DB `RiderLocation`만 upsert하고 Redis GEO에 `GEOADD` 안 함 |

### 2. Order Worker — Centrifugo API 형식 불일치

- Centrifugo v6 HTTP API: `POST /api/publish` + `X-API-Key` 헤더 + `{ channel, data }` 본문
- Order Worker 기존 코드: `POST /api` + `Authorization: apikey ...` + `{ method: "publish", params: { channel, data } }` (v4 레거시 형식)
- `.env` 미로드: `dotenv/config` 임포트가 없어 `CENTRIFUGO_API_KEY`가 빈 문자열 → 401 에러

### 3. JWT 토큰에 채널 구독 정보 누락

- Centrifugo는 JWT 토큰이 있으면 Connect Proxy를 건너뜀
- `/api/chat/token`이 발급하는 JWT에 `channels` 클레임이 없어 서버 사이드 구독이 설정되지 않음
- Connect Proxy(`/api/centrifugo/connect`)에 채널 구독 로직이 있었지만 호출되지 않았음

## 수정 내용

### 1. `src/shared/api/redis.ts` — Redis GEO 헬퍼 함수 추가

- `updateRiderGeo(userId, longitude, latitude)` — `GEOADD rider:locations`
- `removeRiderGeo(userId)` — `ZREM rider:locations` (오프라인 시 제거)

### 2. `src/app/(rider)/_actions/rider-actions.ts` — Redis GEO 동기화

- **`toggleOnlineStatus()`**: 온라인 전환 시 `updateRiderGeo()`, 오프라인 전환 시 `removeRiderGeo()` 호출
- **`updateRiderLocation()`**: DB upsert 후 `updateRiderGeo()` 호출

### 3. `scripts/order-worker.ts` — Centrifugo v6 API 형식 + dotenv

- `dotenv/config` 임포트 추가 (`.env` 로드)
- API 엔드포인트: `/api` → `/api/publish`
- 인증 헤더: `Authorization: apikey ...` → `X-API-Key: ...`
- 요청 본문: `{ method, params: { channel, data } }` → `{ channel, data }`

### 4. `src/app/api/chat/token/route.ts` — JWT에 channels 클레임 추가

- 역할별 서버 사이드 채널 구독을 JWT `channels` 클레임에 포함
- USER: `order#userId`, OWNER: `owner_orders#userId`, RIDER: `delivery_requests#userId`

### 5. `package.json` — Order Worker 로컬 실행 스크립트

- `npm run worker` → `npx tsx scripts/order-worker.ts`

## 영향 범위

- 배달 요청 → 기사 수신 전체 플로우
- 기사 온라인/오프라인 토글
- 기사 위치 업데이트
- 모든 역할의 실시간 채널 구독 (JWT 기반)

## 검증 완료

1. 기사 온라인 전환 → Redis GEO 등록 확인
2. 사장 배달 요청 → Order Worker `[DELIVERY] orderId → delivery_requests#riderId` 출력 확인
3. 기사 브라우저 콘솔에서 `publication received` 이벤트 수신 확인
4. 기사 대시보드에 배달 요청 카드 정상 표시 확인
