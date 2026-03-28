# B-Delivery PRD — 배달기사 (RIDER) 기능
> 원본: `prd-v2.md` 에서 배달기사 관련 기능만 추출. 공통 기반(스키마, 인프라)은 1단계에서 완료된 상태를 전제.

## 담당 범위

| 라우트 그룹 | 설명 |
|------------|------|
| `src/app/(rider)/` | 배달기사 전용 페이지 |

**레이아웃:** 모바일 반응형, 하단 3탭 (배달대기 / 배달내역 / 마이페이지)

## FSD 슬라이스 가이드

```
src/
├── app/(rider)/                 # 라우팅만
├── pages/
│   ├── rider-standby/           # 배달 대기 (콜 대시보드)
│   ├── rider-delivery/          # 배달 진행
│   ├── rider-history/           # 배달 내역 + 수익 대시보드
│   └── rider-mypage/            # 마이페이지
├── widgets/
│   ├── delivery-request-card/   # 배달 요청 카드 (30초 카운트다운)
│   ├── delivery-status-panel/   # 배달 진행 상태 + 버튼
│   ├── rider-stats-card/        # 오늘 통계 카드
│   ├── earnings-dashboard/      # 수익 대시보드 (일/주/월)
│   ├── rider-map/               # 현재 위치 지도
│   └── bottom-navigation/       # 하단 3탭 네비
├── features/
│   ├── delivery/                # 배달 수락/거절/상태변경 (RPC)
│   ├── rider-location/          # 위치 전송 (5초 간격 RPC)
│   └── rider-registration/      # 기사 등록
├── entities/
│   ├── delivery/                # 배달 타입, API
│   └── rider/                   # 기사 프로필 타입, API
```

## 성능 목표

| 지표 | 목표 |
|------|------|
| 위치 전송 → 고객 수신 | < 1초 |
| 배달 요청 수신 | < 2초 |
| 배달 매칭 | < 30초 |

## 캐싱 전략

| 대상 | 저장소 | TTL |
|------|--------|-----|
| 기사 위치 | Redis GEO | 실시간 (5초 갱신) |

## Rate Limiting

| 대상 | 제한 |
|------|------|
| 위치 업데이트 | 5초 간격 |

## 테스트 전략

- **E2E (Playwright):** 온라인 전환 → 배달 요청 수신 → 수락 → 픽업 → 완료 플로우
- **단위 (Vitest):** 배달 거리/시간 계산, 이동수단별 속도 기반 예상 시간

## 의존하는 공통 기반 (1단계에서 완료)
- Prisma 스키마 전체 (특히 Delivery, RiderProfile, RiderLocation)
- NextAuth 인증 + RIDER 역할 체크
- Centrifugo 설정 + Proxy API (특히 RPC: location:update, delivery:accept/reject)
- Redis GEO (GEOADD, GEORADIUS)
- Docker Compose

---

## 기능 명세

### 6.14 배달기사 등록
- 이동 수단 선택: 도보 / 자전거 / 오토바이 / 자동차 (TransportType enum)
- 활동 지역 설정: 주소 검색 → 반경 설정
- 등록 완료 → role USER → RIDER
- DB: RiderProfile 생성

### 6.15 배달 대기 화면 (콜 대시보드)
- **온라인/오프라인 토글 (상단 고정)**
  - 온라인: 위치 전송 시작 (5초 간격 RPC), 배달 요청 수신
  - 오프라인: 위치 전송 중단, 요청 수신 안 함
  - DB: RiderLocation.isOnline 업데이트
- **현재 위치 지도 표시** (카카오 맵)
- **1건만 수행 가능** (배달 중 → 새 요청 수신 안 함)
- **오늘 배달 통계 카드 (상단 고정):**
  - 완료 건수 / 총 수익 / 온라인 시간 / 평균 배달 시간

**배달 요청 카드 (수신 시):**
- 가게명, 가게 위치, 고객 위치
- 가게까지 거리 (현재 위치 → 가게), 총 이동 거리 (가게 → 고객)
- 예상 배달비
- **수락 / 거절 버튼**
- **30초 카운트다운 프로그레스 바** (초과 시 자동 거절)
- 알림음 + 진동 (모바일 웹)
- Centrifugo `delivery_requests#<riderId>` 채널에서 수신

**배달 매칭 알고리즘 (서버 사이드, 참고용):**
1. 가게 반경 3km 내 온라인 + 미배달 중인 기사 → 동시 브로드캐스트 (선착순)
2. 30초 내 수락 없음 → 5km 확장 2차 브로드캐스트
3. 2차 실패 → 사장에게 매칭 실패 알림, WAITING_RIDER → COOKING 롤백

### 6.16 배달 진행 화면
- **단계별 상태 + 액션 버튼:**

| 단계 | 화면 표시 | 버튼 | DB 변경 |
|------|----------|------|--------|
| 가게로 이동 | 가게 위치 네비게이션 | '가게 도착' | Delivery.status = AT_STORE |
| 음식 수령 | 가게 도착 상태 | '픽업 완료' | Order.status = PICKED_UP, Delivery.status = PICKED_UP |
| 고객에게 이동 | 고객 위치 네비게이션 | '배달 완료' | Order.status = DONE, Delivery.status = DONE |

- **이동 중 5초 간격 위치 전송:** Centrifugo RPC "location:update" → Redis GEO + rider_location 채널
- 고객/가게 정보: 주소, 상세주소
- 주문 상세: 메뉴 목록 (수령 확인용)

### 6.17 배달 내역 & 수익 대시보드

**수익 대시보드 (상단):**
- 오늘 수익: 실시간 갱신 + 전일 대비 증감률
- 이번 주 수익: 주간 합계 + 일별 막대 그래프
- 이번 달 수익: 월간 합계
- 목표 수익 달성률: 기사 설정 일일 목표 대비 프로그레스 바

**배달 통계:**
- 총 건수 / 평균 배달 시간 / 평균 거리
- 시간대별 배달 건수 히트맵

**완료 배달 목록:**
- 날짜별 그룹화
- 카드: 시간, 가게명, 고객 주소, 거리, 배달비, 소요 시간
- 기간 필터: 오늘 / 이번 주 / 이번 달 / 직접 선택

### 6.8.4 기사 채팅 (RIDER → ADMIN)
- 마이페이지 → 고객센터 문의 버튼
- chatType: `RIDER_SUPPORT`
- 배달 관련: 배달 선택 → 위치 못 찾음, 가게 준비 중 등
- 계정 관련: 수익 정산, 계정 문의
- 채팅 공통 UI (6.8.6) 사용

---

## 배달 상태 전이 (기사 관점)

| DeliveryStatus | 기사 액션 | 다음 상태 | Order 변경 |
|---------------|----------|----------|-----------|
| REQUESTED | 수락 (RPC) | ACCEPTED | Order: RIDER_ASSIGNED |
| REQUESTED | 거절/타임아웃 | - | (다른 기사에게 재요청) |
| ACCEPTED | 가게 도착 | AT_STORE | - |
| AT_STORE | 픽업 완료 | PICKED_UP | Order: PICKED_UP |
| PICKED_UP | (이동 중) | DELIVERING | - |
| DELIVERING | 배달 완료 | DONE | Order: DONE |
| ACCEPTED | 취소 (사유 필수) | CANCELLED | Order: WAITING_RIDER (재매칭) |

## Centrifugo 채널 (기사가 구독)

| 채널 | 용도 | 구독 방식 |
|------|------|----------|
| `delivery_requests#<riderId>` | 배달 요청 수신 | Connect Proxy (서버 사이드) |
| `user#<userId>` | 채팅 알림 | Connect Proxy (서버 사이드) |
| `chat:<chatId>` | 채팅방 메시지 | Subscribe |

## Centrifugo RPC (기사가 호출)

| RPC method | 용도 | 페이로드 |
|------------|------|---------|
| `location:update` | 위치 전송 (5초) | `{ lat, lng }` |
| `delivery:accept` | 배달 수락 | `{ orderId }` |
| `delivery:reject` | 배달 거절 | `{ orderId, reason? }` |
| `delivery:status` | 상태 변경 | `{ orderId, status: AT_STORE/PICKED_UP/DONE }` |

## 관련 DB 모델
User, RiderProfile, RiderLocation, Delivery, Order, Chat (RIDER_SUPPORT), Message
