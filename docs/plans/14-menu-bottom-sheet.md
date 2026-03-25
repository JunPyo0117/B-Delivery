# Task #14: 메뉴 선택 및 옵션 바텀시트

## 개요
음식점 상세 페이지에서 메뉴 아이템 클릭 시 바텀시트(Drawer)를 표시하여
메뉴 상세 정보 확인 및 수량 선택 후 장바구니에 담을 수 있는 기능 구현.

## 구현 범위

### 1. shadcn/ui Drawer 컴포넌트 설치
- `npx shadcn@latest add drawer` 실행
- vaul 라이브러리 기반 모바일 친화적 바텀시트

### 2. 카트 Zustand 스토어 (`src/stores/cart.ts`)
- **CartItem 타입**: menuId, name, price, imageUrl, quantity, restaurantId, restaurantName
- **Actions**: addItem, removeItem, updateQuantity, clearCart, getTotal
- **다른 가게 메뉴 추가 시**: 기존 장바구니 비우기 확인 로직

### 3. 메뉴 바텀시트 컴포넌트 (`src/components/menu-bottom-sheet.tsx`)
- Drawer (vaul) 기반 바텀시트
- 메뉴 이미지, 이름, 설명, 가격 표시
- 수량 선택 (+/- 버튼, 최소 1, 최대 99)
- 총 가격 = 단가 × 수량
- '장바구니 담기' 버튼 → 카트 스토어에 추가 후 닫기
- 다른 가게 메뉴가 이미 있을 경우 교체 확인 다이얼로그

### 4. 기존 컴포넌트 수정
- `MenuItemCard`: 클릭 이벤트 + menuId 추가
- `MenuSection`: menuId 전달
- 음식점 상세 페이지: 클라이언트 래퍼 컴포넌트로 바텀시트 통합

## 데이터 흐름
```
MenuItemCard 클릭
  → MenuBottomSheet 열림 (선택된 메뉴 정보 전달)
  → 수량 선택
  → '장바구니 담기' 클릭
  → useCartStore.addItem() 호출
  → 바텀시트 닫힘
  → 토스트 알림
```

## 파일 변경 목록
- `src/components/ui/drawer.tsx` — shadcn/ui Drawer (신규, CLI 설치)
- `src/stores/cart.ts` — 카트 스토어 (신규)
- `src/components/menu-bottom-sheet.tsx` — 바텀시트 컴포넌트 (신규)
- `src/app/(customer)/restaurants/[id]/_components/menu-item-card.tsx` — 클릭 이벤트 추가
- `src/app/(customer)/restaurants/[id]/_components/menu-section.tsx` — menuId 전달
- `src/app/(customer)/restaurants/[id]/_components/menu-list-client.tsx` — 클라이언트 래퍼 (신규)
- `src/app/(customer)/restaurants/[id]/page.tsx` — 래퍼 사용
