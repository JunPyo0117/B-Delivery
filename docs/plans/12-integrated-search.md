# Task #12: 통합 검색 기능

## 개요
홈 화면 상단에 검색바를 추가하여 음식점 이름, 메뉴 이름, 메뉴 카테고리를 통합 검색하는 기능을 구현한다.

## 구현 범위

### 1. 검색 API (`/api/search`)
- **Method**: GET
- **Query Params**: `q` (검색어, 최소 1글자)
- **응답**: 검색 결과 배열 (최대 20건)
- **검색 대상**: Restaurant.name, Menu.name, Menu.category
- **조건**: `isOpen = true`, `isSoldOut = false`인 항목만
- **Prisma OR 조건**으로 통합 검색 (contains, insensitive mode)
- **응답 필드**: restaurantId, restaurantName, restaurantImageUrl, matchedMenuName, price, avgRating, reviewCount

### 2. 커스텀 훅 (`useSearch`)
- 디바운스 300ms 적용
- 검색어 상태 관리
- fetch 결과 캐싱 (간단 state)
- 로딩/에러 상태

### 3. 검색바 컴포넌트 (`SearchBar`)
- HomeHeader 아래에 배치
- 포커스 시 검색 결과 드롭다운 표시
- 검색 결과 항목: 음식점 이름, 매칭 메뉴명, 가격, 평점
- 클릭 시 `/restaurants/[id]`로 이동
- 외부 클릭 시 드롭다운 닫기

### 4. 홈 페이지 통합
- `page.tsx`에 SearchBar 추가 (HomeHeader와 CategoryGrid 사이)

## 파일 구조
```
src/
├── app/api/search/route.ts          # 검색 API
├── app/(customer)/_components/
│   └── search-bar.tsx               # 검색바 + 드롭다운
├── hooks/use-search.ts              # 디바운스 검색 훅
└── types/search.ts                  # 검색 타입
```

## 기술 결정
- Prisma ORM의 `contains` + `mode: 'insensitive'` 사용
- Menu 기준 검색 후 Restaurant 정보를 include로 가져옴
- 음식점 이름 검색은 별도 쿼리 후 합산 (중복 제거)
- 디바운스는 커스텀 훅으로 구현 (외부 라이브러리 불필요)
