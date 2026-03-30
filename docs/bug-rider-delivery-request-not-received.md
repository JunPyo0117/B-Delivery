# 버그 리포트: 배달 기사에게 배달 요청이 수신되지 않는 문제

## 증상

사장이 배달 요청(COOKING → WAITING_RIDER)을 하면 Delivery 레코드가 생성되고 Redis Stream에 이벤트가 발행되지만, 배달 기사 대시보드에 배달 요청 카드가 표시되지 않음.

## 근본 원인

**Redis GEO 미등록**: Order Worker가 `GEORADIUS("rider:locations", ...)` 로 반경 3km 내 기사를 검색하는데, 기사 위치가 Redis GEO에 한 번도 등록되지 않아 `nearbyRiders = []` → 아무에게도 Centrifugo 발행이 안 됨.

### 원인 상세

| 함수 | 문제 |
|------|------|
| `toggleOnlineStatus()` | DB `RiderLocation.isOnline`만 토글하고 Redis GEO에 `GEOADD` 안 함 |
| `updateRiderLocation()` | DB `RiderLocation`만 upsert하고 Redis GEO에 `GEOADD` 안 함 |

즉 DB에는 기사 위치가 있지만 Order Worker가 읽는 Redis GEO(`rider:locations`)는 항상 비어 있었음.

## 수정 내용

### 1. `src/shared/api/redis.ts` — Redis GEO 헬퍼 함수 추가

- `updateRiderGeo(userId, longitude, latitude)` — `GEOADD rider:locations`
- `removeRiderGeo(userId)` — `ZREM rider:locations` (오프라인 시 제거)

### 2. `src/app/(rider)/_actions/rider-actions.ts` — Redis GEO 동기화

- **`toggleOnlineStatus()`**: 온라인 전환 시 `updateRiderGeo()`, 오프라인 전환 시 `removeRiderGeo()` 호출
- **`updateRiderLocation()`**: DB upsert 후 `updateRiderGeo()` 호출

### 3. `package.json` — Order Worker 로컬 실행 스크립트

- `npm run worker` → `npx tsx scripts/order-worker.ts`

## 영향 범위

- 배달 요청 → 기사 수신 전체 플로우
- 기사 온라인/오프라인 토글
- 기사 위치 업데이트

## 검증 방법

1. 기사 로그인 → 온라인 전환 → Redis에 `GEOPOS rider:locations <userId>` 확인
2. 사장 배달 요청 → Order Worker 로그에 `[DELIVERY] orderId → delivery_requests#riderId` 출력 확인
3. 기사 대시보드에 배달 요청 카드 표시 확인
