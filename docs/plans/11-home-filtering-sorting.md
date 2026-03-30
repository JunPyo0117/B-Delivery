# Task #11: 홈 화면 필터링 및 정렬 기능

## 개요
홈 화면에 카테고리 필터링(기존)과 정렬 기능을 추가하여 사용자가 원하는 기준으로 음식점 목록을 조회할 수 있도록 한다.

## 현재 상태 분석
- `CategoryGrid` 컴포넌트: 이미 search params 기반 카테고리 필터링 존재
- `RestaurantList` 컴포넌트: 카테고리 변경 시 API 호출하여 리스트 재로드
- API(`/api/restaurants`): 카테고리 WHERE 조건 지원, `ORDER BY distance ASC` 고정
- 서버 컴포넌트(`page.tsx`): search params 미사용, 항상 거리순 정렬

## 구현 계획

### 1. 정렬 옵션 정의
| 값 | 라벨 | SQL ORDER BY |
|----|------|-------------|
| `distance` (기본) | 배달 빠른 순 | `distance ASC` |
| `rating` | 평점 순 | `"avgRating" DESC` |
| `minOrder` | 최소 주문금액 순 | `r."minOrderAmount" ASC` |

### 2. 수정 파일 목록
1. **`src/lib/constants.ts`** — 정렬 옵션 상수 추가
2. **`src/app/(customer)/_components/sort-select.tsx`** — 정렬 셀렉트 컴포넌트 (새로 생성)
3. **`src/app/(customer)/_components/restaurant-list.tsx`** — 정렬 search param 반영
4. **`src/app/api/restaurants/route.ts`** — sort 파라미터에 따른 ORDER BY 분기
5. **`src/app/(customer)/page.tsx`** — search params를 서버 쿼리에 반영, SortSelect 배치

### 3. URL 구조
```
/?category=CHICKEN&sort=rating
/?sort=minOrder
```

### 4. 컴포넌트 구조
```
HomePage (Server Component)
├── HomeHeader
├── CategoryGrid (기존 — 카테고리 필터)
├── SortSelect (신규 — 정렬 옵션)
└── RestaurantList (기존 — 정렬 param 추가 반영)
```
