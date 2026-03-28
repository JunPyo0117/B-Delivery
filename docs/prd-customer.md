# B-Delivery PRD — 고객 (USER) 기능
> 원본: `prd-v2.md` 에서 고객 관련 기능만 추출. 공통 기반(스키마, 인프라)은 1단계에서 완료된 상태를 전제.

## 담당 범위

| 라우트 그룹 | 설명 |
|------------|------|
| `src/app/(customer)/` | 고객 전용 페이지 |
| `src/app/(auth)/` | 로그인 (공통이지만 고객이 주 사용자) |

**레이아웃:** 모바일 반응형, 하단 4탭 (홈 / 찜 / 주문내역 / 마이페이지)

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
