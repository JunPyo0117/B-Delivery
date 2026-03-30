# B-Delivery PRD — 고객 (USER) 기능
> 원본: `prd-v2.md` 에서 고객 관련 기능만 추출. 공통 기반(스키마, 인프라)은 1단계에서 완료된 상태를 전제.

## 담당 범위

| 라우트 그룹 | 설명 |
|------------|------|
| `src/app/(customer)/` | 고객 전용 페이지 |
| `src/app/(auth)/` | 로그인 (공통이지만 고객이 주 사용자) |

**레이아웃:** 모바일 반응형, 하단 4탭 (홈 / 찜 / 주문내역 / 마이페이지)

## UI 참조

### 스크린샷 (ui/ 폴더)

| 파일명 | 해당 화면 |
|--------|----------|
| `ui/1.메인페이지.png` | 홈 화면 (Feed) |
| `ui/2.찜목록페이지.png` | 관심 음식점 (찜) |
| `ui/3.가게상세페이지.png` | 음식점 상세 상단 |
| `ui/6.가게 페이지.png` | 음식점 메뉴 탭 |
| `ui/7. 가게페이지2.png` | 음식점 상세 배달 정보 |
| `ui/8. 음식점 리뷰페이지.png` | 리뷰 목록 |
| `ui/9. 장바구니페이지.png` | 장바구니 (빈 상태) |
| `ui/10. 장바구니페이지 2.png` | 장바구니 (담긴 상태) |
| `ui/11. 장바구니에...팝업.png` | 장바구니 초기화 경고 |
| `ui/12. 상담 채팅 페이지.png` | 고객센터 채팅 |
| `ui/4.마이페이지.png` | 마이페이지 |
| `ui/5.주문내역.png` | 주문 내역 |

### 와이어프레임 (.pen 파일 — Pencil MCP 도구로 읽기)

> **파일:** `.pencil/pencil-new.pen` — Pencil MCP `batch_get` 도구로 구조를 읽고, `export_nodes`로 이미지 내보내기 가능.

| 노드 이름 | 화면 | PRD 섹션 |
|-----------|------|---------|
| `USER-01 로그인` | 로그인 화면 | 6.1 |
| `USER-02 주소설정` | 주소 설정 | 6.3 |
| `USER-03 홈` | 홈 (Feed) | 6.4 |
| `USER-04 검색결과` | 검색 결과 | 6.4-1 |
| `USER-05 음식점상세` | 음식점 상세 + 메뉴 | 6.5 |
| `USER-06 메뉴옵션` | 메뉴 옵션 바텀시트 | 6.5-1 |
| `USER-07 장바구니빈` | 장바구니 (빈) | 6.6 |
| `USER-08 장바구니담긴` | 장바구니 (담긴) | 6.6 |
| `USER-09 장바구니팝업` | 장바구니 초기화 경고 | 6.6 |
| `USER-10 주문상태` | 주문 상태 (프로그레스 + 지도) | 6.7 |
| `USER-11 채팅목록` | 채팅 목록 | 6.8 |
| `USER-12 채팅방` | 채팅방 | 6.8 |
| `USER-13 리뷰작성` | 리뷰 작성 | 6.9 |
| `USER-14 리뷰목록` | 리뷰 목록 | 6.9 |
| `USER-15 마이페이지` | 마이페이지 | 6.10 |
| `USER-16 주문내역` | 주문 내역 | 6.10.2 |
| `USER-17 찜목록` | 관심 음식점 | 6.10.3 |
| `USER-18 리뷰관리` | 리뷰 관리 | 6.10.4 |
| `USER-19 주소관리` | 주소 관리 | 6.10.5 |
| `USER-20 프로필수정` | 프로필 수정 | 6.2 |
| `USER-21 음식점등록` | 음식점 등록 신청 | 6.10.6 |
| `USER-22 배달기사등록` | 배달기사 등록 신청 | 6.10.7 |

**공통 컴포넌트 (재사용):**
`BottomNav-USER`, `StatusBar`, `HeaderNav`, `SearchBar`, `RestaurantCard`, `MenuItemCard`, `CartItemCard`, `OrderCard`, `ReviewCard`, `ChatBubbleLeft`, `ChatBubbleRight`, `StarRating`, `CategoryIcon`, `Badge`, `Avatar`, `ButtonPrimary`, `ButtonOutline`, `InputField`, `Divider`, `Separator`

## FSD 슬라이스 가이드

```
src/
├── app/(customer)/              # 라우팅만 (page.tsx → pages/ import)
├── pages/
│   ├── home/                    # 홈 화면 조합
│   ├── restaurant-detail/       # 음식점 상세 조합
│   ├── cart/                    # 장바구니 조합
│   ├── order-status/            # 주문 상태 조합
│   ├── chat/                    # 채팅 조합
│   └── my-page/                 # 마이페이지 조합
├── widgets/
│   ├── restaurant-card/         # 음식점 카드 (홈 리스트)
│   ├── order-status-tracker/    # 주문 상태 프로그레스 바 + 지도
│   ├── menu-option-sheet/       # 메뉴 옵션 바텀시트
│   └── bottom-navigation/       # 하단 4탭 네비
├── features/
│   ├── cart/                    # 장바구니 (addItem, store, placeOrder)
│   ├── order/                   # 주문 상태 관리 (Centrifugo 구독)
│   ├── review/                  # 리뷰 작성
│   ├── favorite/                # 찜 토글
│   ├── search/                  # 통합 검색
│   └── menu-option/             # 옵션 선택 로직
├── entities/
│   ├── restaurant/              # 음식점 타입, API, 카드 UI
│   ├── menu/                    # 메뉴 타입, API
│   ├── order/                   # 주문 타입, API
│   └── review/                  # 리뷰 타입, API
```

각 슬라이스 내부: `ui/` | `model/` | `api/` | `lib/` → `index.ts` re-export

## 성능 목표

| 지표 | 목표 |
|------|------|
| 반경 검색 (음식점 목록) | < 200ms |
| 이미지 로딩 | < 1초 |
| 배달기사 위치 지연 | < 1초 |
| 주문 상태 변경 → 화면 갱신 | < 1초 |

## 캐싱 전략

| 대상 | TTL | 무효화 |
|------|-----|--------|
| 음식점 목록 | Redis 5분 | 등록/수정/삭제 시 |
| 메뉴 데이터 | Redis 10분 | 수정/품절 시 |

## Rate Limiting

| 대상 | 제한 |
|------|------|
| 주문 생성 | 분당 5회 |
| 검색 | 분당 30회 |

## 테스트 전략

- **E2E (Playwright):** 음식점 탐색 → 메뉴+옵션 선택 → 장바구니 → 주문 확정 → 주문 상태 확인
- **단위 (Vitest):** 장바구니 로직 (옵션 가격 계산, 품절 검증, 최소 주문금액), 주문 확정 검증 4단계

## 의존하는 공통 기반 (1단계에서 완료)
- Prisma 스키마 전체 (User, Restaurant, Menu, MenuOptionGroup, MenuOption, Order, OrderItem, Review, FavoriteRestaurant, Chat, Message, UserAddress)
- NextAuth 인증 (Google OAuth)
- Centrifugo 설정 + Proxy API 4개
- Docker Compose
- 공통 타입/enum (OrderStatus, RestaurantCategory 등)

---

## 기능 명세

### 6.1 사용자 인증
- 소셜 로그인 (Google)
- 역할: USER (기본) / OWNER / RIDER / ADMIN
- 역할 규칙: 1개만 보유 가능. OWNER/RIDER 등록은 role == USER일 때만.

### 6.2 사용자 프로필
- 닉네임, 프로필 사진, 기본 배달 주소
- '프로필 수정' 버튼

### 6.3 배달 주소 설정
- **위치 권한 허용:** Geolocation API → 카카오 좌표→주소 변환 → 자동 설정
- **위치 권한 거부:** 카카오 우편번호 서비스로 수동 입력
- 주소 설정 완료 전 홈 화면 진입 불가
- 설정된 주소 반경 3km 내 음식점 탐색

### 6.4 홈 화면 (Feed)
*UI 참조: `ui/1.메인페이지.png`*
- 반경 3km 내 음식점 리스트 (무한 스크롤)
- 카테고리 아이콘 (가로 스크롤): KOREAN / CHINESE / JAPANESE / CHICKEN / PIZZA / BUNSIK / JOKBAL / FASTFOOD / CAFE / JJAMBBONG / RICE_BOWL / ETC
- 정렬: 배달 빠른 순, 평점 순, 최소 주문금액 순
- 카드: 썸네일, 음식점명, 카테고리, 평점, 리뷰 수, 배달 시간, 최소 주문금액
- 캐싱: Redis Cache (TTL 5분)

### 6.4-1 검색
*UI 참조: `ui/1.메인페이지.png` 상단*
- 음식점명 / 메뉴명 / 메뉴 카테고리 통합 검색
- 결과 카드: 음식점명, 매칭 메뉴명, 가격, 평점

### 6.5 음식점 상세 + 메뉴
*UI 참조: `ui/3.가게상세페이지.png`, `ui/6.가게 페이지.png`, `ui/7. 가게페이지2.png`*
- 음식점 정보: 이름, 대표 사진, 평점, 리뷰 수, 영업시간, 최소 주문금액, 배달비
- 영업 상태: 영업 중 / 영업 종료 / 준비 중 — 종료 시 주문 버튼 비활성화
- 메뉴 탭: 인기 / 신메뉴 / 전체 (가로 스크롤)
- 품절 표시: 흐리게 + "품절" 뱃지 + 담기 비활성화

### 6.5-1 메뉴 옵션 시스템
- 옵션 그룹 (MenuOptionGroup): 그룹명, 필수 여부, 최대 선택 수
- 옵션 항목 (MenuOption): 옵션명, 추가 가격
- 바텀시트 UI: 필수 옵션 미선택 시 담기 불가, 하단 총 가격 실시간 갱신
- 같은 메뉴라도 옵션 다르면 별도 아이템

### 6.6 장바구니 & 주문
*UI 참조: `ui/9. 장바구니페이지.png`, `ui/10. 장바구니페이지 2.png`, `ui/11. ...팝업.png`*
- 메뉴 목록, 선택 옵션 표시, 수량 조정, 합계 금액
- 한 음식점만 담기 (다른 음식점 → 초기화 경고 팝업)
- **주문 확정 시 검증:**
  1. 품절 체크
  2. 가격 변동 체크
  3. 영업 상태 체크
  4. 최소 주문금액 체크
- 배달 요청사항 입력 (선택)

### 6.7 주문 상태
- 카카오 지도에 음식점 위치 핀 + 주문 상태 오버레이
- 프로그레스 바: 접수 → 조리중 → 기사 배정 → 픽업 → 배달 중 → 완료
- WAITING_RIDER: "배달기사를 찾고 있어요..." 애니메이션
- RIDER_ASSIGNED: 기사 정보 표시
- **PICKED_UP: 지도에 기사 실시간 위치 핀** + "배달 중, 도착 예정 N분"
  - Centrifugo `rider_location:<orderId>` 채널 구독
  - N분 = 직선거리 / 이동수단별 속도 (도보 4, 자전거 15, 오토바이 30, 자동차 25 km/h)
- 취소 버튼: PENDING/COOKING 상태에서만
- 실시간: Centrifugo `order#<userId>` 채널

### 6.8 채팅 (고객 → ADMIN)
*UI 참조: `ui/12. 상담 채팅 페이지.png`*
- 채팅 진입 시 문의할 주문 선택 (최근 주문 목록)
- "주문 말고 다른 문의가 있어요" → 일반 문의
- 문의 카테고리: 주문 / 배달 / 결제 / 기타
- chatType: `CUSTOMER_SUPPORT`
- **채팅 목록:** 내 채팅방 리스트 (최신순, 미읽음 뱃지)
- **채팅방 공통 UI:**
  - Centrifugo WebSocket 실시간 통신
  - 텍스트 (Enter 전송, Shift+Enter 줄바꿈)
  - 이미지 (5MB, MinIO Presigned URL)
  - 시스템 메시지
  - 읽음 확인, 타이핑 인디케이터, 날짜 구분선, 페이징 (50개)

### 6.9 리뷰
*UI 참조: `ui/8. 음식점 리뷰페이지.png`*
- **작성:** 배달 완료 후, 별점 1~5 필수, 텍스트 선택, 이미지 최대 3장, 체크리스트
- **목록:** 별점 분포 차트, 사장님 공지, 사진 리뷰 필터, 신고 버튼
- 사장 답글 표시 영역

### 6.10 마이페이지
*UI 참조: `ui/4.마이페이지.png`*
- 프로필 섹션 + 수정
- **주문 내역** (`ui/5.주문내역.png`): 배달중/완료 탭, 재주문, 리뷰 작성 버튼
- **관심 음식점 (찜)** (`ui/2.찜목록페이지.png`)
- **리뷰 관리:** 수정/삭제
- **주소 관리:** 추가/수정/삭제, 기본 주소 설정
- **음식점 등록 신청:** role == USER에게만 노출 → 6.11로 이동
- **배달기사 등록 신청:** role == USER에게만 노출 → 6.14로 이동

---

## 주문 상태 전이 (고객 관점)

| 상태 | 고객 화면 | 취소 가능 |
|------|----------|----------|
| PENDING | "주문이 접수되었습니다" | O |
| COOKING | "음식을 조리하고 있어요" | O (수수료 안내) |
| WAITING_RIDER | "배달기사를 찾고 있어요..." | X |
| RIDER_ASSIGNED | 기사 정보 표시 | X |
| PICKED_UP | 기사 실시간 위치 + 도착 예정 | X |
| DONE | "배달이 완료되었습니다" | X |
| CANCELLED | "주문이 취소되었습니다" | - |

## Centrifugo 채널 (고객이 구독)

| 채널 | 용도 | 구독 방식 |
|------|------|----------|
| `order#<userId>` | 주문 상태 변경 알림 | Connect Proxy (서버 사이드) |
| `user#<userId>` | 채팅 목록 업데이트, 읽음 | Connect Proxy (서버 사이드) |
| `chat:<chatId>` | 채팅방 메시지 | Subscribe (채팅방 진입 시) |
| `rider_location:<orderId>` | 배달 기사 위치 | Subscribe (주문 상태 페이지) |

## 관련 DB 모델
User, UserAddress, Restaurant, Menu, MenuOptionGroup, MenuOption, Order, OrderItem, Review, FavoriteRestaurant, Chat (CUSTOMER_SUPPORT), Message
