# E2E 테스트 리포트: 주문 전체 플로우

- **테스트일**: 2026-03-26
- **도구**: Playwright MCP (Chromium, 480x800)
- **테스트 범위**: 고객 주문 → 사장 주문 처리 → 배달 완료

## 테스트 시나리오

### 사전 조건
- 고객 계정: `user@bdelivery.com` (주소: 서울 영등포구 선유서로25길 28)
- 사장 계정: `owner174@test.com` (치킨플러스 영등포점)

### 플로우

| 단계 | 역할 | 동작 | 기대 결과 | 실제 결과 |
|------|------|------|----------|----------|
| 1 | 고객 | 테스트 계정으로 로그인 | 홈 화면 진입 | PASS |
| 2 | 고객 | 음식점 목록에서 "치킨플러스 영등포점" 클릭 | 음식점 상세 페이지 | PASS |
| 3 | 고객 | "반반 치킨" 메뉴 + 버튼 클릭 | 바텀시트 표시 | PASS |
| 4 | 고객 | "19,000원 담기" 클릭 | 장바구니 추가, 플로팅 바 표시 | PASS |
| 5 | 고객 | 플로팅 바 클릭 → 장바구니 이동 | 장바구니 페이지 | PASS |
| 6 | 고객 | "한집배달 주문하기" 클릭 | 주문 생성 → 주문상세 이동 | **FAIL → FIX 후 PASS** |
| 7 | 고객 | 주문상세 페이지 확인 | 주문 접수 상태, 금액/주소 정확 | PASS |
| 8 | 사장 | 로그아웃 → 사장 계정 로그인 | 로그인 성공 | PASS |
| 9 | 사장 | /owner/orders 접근 | 신규 주문 탭에 주문 표시 | PASS |
| 10 | 사장 | "주문 수락" 클릭 | PENDING → COOKING | PASS |
| 11 | 사장 | "처리중" 탭 → "픽업 완료" 클릭 | COOKING → PICKED_UP | PASS |
| 12 | 사장 | "배달 완료" 클릭 | PICKED_UP → DONE | PASS |
| 13 | 사장 | "완료" 탭 확인 | 주문이 완료 상태로 표시 | PASS |
| 14 | 고객 | 로그아웃 → 고객 계정 로그인 | 로그인 성공 | PASS |
| 15 | 고객 | /orders 주문내역 확인 | 배달 완료 + "리뷰 작성" 버튼 | PASS |

## 발견된 UI 버그

### BUG-1: 장바구니 주문 버튼이 BottomNav에 가려짐 (Critical)

**증상**: 장바구니 페이지에서 "한집배달 주문하기" 버튼을 클릭할 수 없음. BottomNav가 버튼 위를 덮고 있어 터치/클릭 이벤트가 BottomNav로 전달됨.

**원인**:
- 주문 버튼: `fixed bottom-0 z-20`
- BottomNav: `fixed bottom-0 z-50`
- BottomNav의 z-index(50)가 주문 버튼(20)보다 높아 항상 위에 렌더링

**수정**:
- `bottom-nav.tsx`: 장바구니 경로(`/cart`)를 `HIDDEN_PATH_PREFIXES`에 추가하여 BottomNav 숨김
- `cart/page.tsx`: 하단 버튼을 `max-w-[480px]` 컨테이너에 맞추고 z-index를 z-50으로 통일

```diff
// bottom-nav.tsx
- const HIDDEN_PATH_PREFIXES = ["/chat/", "/restaurants/"];
+ const HIDDEN_PATH_PREFIXES = ["/chat/", "/restaurants/", "/cart"];

// cart/page.tsx
- <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 safe-area-inset-bottom">
+ <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white border-t border-gray-200">
```

**상태**: 수정 완료, 재테스트 PASS

### BUG-2: 메뉴 바텀시트 "담기" 버튼이 CartFloatingBar에 가려짐 (Medium)

**증상**: 장바구니에 이미 아이템이 있는 상태에서 음식점 상세 페이지의 메뉴 바텀시트 "X원 담기" 버튼이 CartFloatingBar에 가려져 클릭할 수 없음.

**원인**:
- 메뉴 바텀시트의 "담기" 버튼이 화면 하단에 위치
- CartFloatingBar가 `fixed bottom-0 z-50`으로 배치되어 "담기" 버튼 위를 덮음

**상태**: 미수정 (바텀시트의 z-index를 CartFloatingBar보다 높게 설정하거나, 바텀시트 열릴 때 FloatingBar를 숨기는 처리 필요)

### BUG-3: 장바구니 페이지 Hydration 에러 (Medium)

**증상**: 장바구니 페이지 진입 시 콘솔에 "Hydration failed because the server rendered text didn't match the client" 에러 발생. 서버에서는 금액이 `0`이지만 클라이언트에서는 `38,000` 등 실제 값이 표시됨.

**원인**: Zustand `persist` 미들웨어가 localStorage에서 장바구니를 복원하는데, 서버 렌더링 시에는 초기값(빈 장바구니)으로 렌더링됨. 클라이언트 hydration 시 localStorage에서 복원된 값과 불일치.

**수정**:
- `mounted` 상태를 추가하여 hydration 완료 전까지 초기값(0)을 사용
- `useEffect`로 마운트 감지 후 실제 값으로 전환

```diff
+ const [mounted, setMounted] = useState(false);
+ useEffect(() => { setMounted(true); }, []);

- const subtotal = getTotal();
- const totalQuantity = getTotalQuantity();
+ const subtotal = mounted ? getTotal() : 0;
+ const totalQuantity = mounted ? getTotalQuantity() : 0;
```

**상태**: 수정 완료

## 정상 동작 확인 항목

- 카테고리별 음식점 필터링 정상
- 음식점 상세 페이지 메뉴 탭/목록 정상
- 장바구니 수량 조절 정상
- 주문 생성 시 배달 주소 자동 적용
- 사장 페이지 탭 전환 (신규 주문/처리중/완료) 정상
- 주문 상태 전이 (PENDING → COOKING → PICKED_UP → DONE) 정상
- 고객 주문내역에서 배달 완료 후 "리뷰 작성" 버튼 표시

## 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/app/(customer)/_components/bottom-nav.tsx` | `/cart` 경로에서 BottomNav 숨김 |
| `src/app/(customer)/cart/page.tsx` | 하단 주문 버튼 z-index/레이아웃 수정 + Hydration 에러 수정 |
