export interface MenuTemplateItem {
  name: string;
  price: number;
  description: string;
  category: string;
  options?: {
    groupName: string;
    isRequired: boolean;
    maxSelect: number;
    items: { name: string; extraPrice: number }[];
  }[];
}

export const MENU_TEMPLATES: Record<string, MenuTemplateItem[]> = {
  CHICKEN: [
    { name: "후라이드치킨", price: 0, description: "바삭 후라이드", category: "치킨", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "한마리", extraPrice: 0 }, { name: "반마리", extraPrice: -5000 }] }, { groupName: "부위", isRequired: false, maxSelect: 1, items: [{ name: "순살", extraPrice: 2000 }, { name: "뼈", extraPrice: 0 }] }] },
    { name: "양념치킨", price: 0, description: "달콤 매콤 양념", category: "치킨", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "한마리", extraPrice: 0 }, { name: "반마리", extraPrice: -5000 }] }] },
    { name: "간장치킨", price: 0, description: "달콤한 간장", category: "치킨", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "한마리", extraPrice: 0 }, { name: "반마리", extraPrice: -5000 }] }] },
    { name: "반반치킨", price: 0, description: "후라이드+양념", category: "치킨" },
    { name: "치킨텐더", price: 0, description: "순살 텐더", category: "사이드" },
    { name: "치즈볼", price: 0, description: "쫀득 치즈볼", category: "사이드" },
    { name: "콜라", price: 0, description: "시원한 콜라", category: "음료", options: [{ groupName: "사이즈", isRequired: false, maxSelect: 1, items: [{ name: "500ml", extraPrice: 0 }, { name: "1.5L", extraPrice: 1000 }] }] },
  ],
  KOREAN: [
    { name: "된장찌개", price: 0, description: "구수한 된장찌개", category: "찌개" },
    { name: "김치찌개", price: 0, description: "얼큰한 김치찌개", category: "찌개" },
    { name: "제육볶음", price: 0, description: "매콤 제육볶음 정식", category: "정식" },
    { name: "비빔밥", price: 0, description: "신선한 나물 비빔밥", category: "밥" },
    { name: "불고기 정식", price: 0, description: "달콤한 불고기", category: "정식" },
    { name: "공기밥", price: 0, description: "갓 지은 공기밥", category: "밥" },
  ],
  CHINESE: [
    { name: "짜장면", price: 0, description: "춘장 듬뿍", category: "면" },
    { name: "짬뽕", price: 0, description: "얼큰한 해물짬뽕", category: "면" },
    { name: "탕수육", price: 0, description: "바삭한 탕수육", category: "튀김", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "소", extraPrice: 0 }, { name: "대", extraPrice: 7000 }] }] },
    { name: "볶음밥", price: 0, description: "새우볶음밥", category: "밥" },
    { name: "군만두", price: 0, description: "바삭 군만두 5개", category: "만두" },
  ],
  PIZZA: [
    { name: "페퍼로니 피자", price: 0, description: "클래식 페퍼로니", category: "피자", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "M", extraPrice: 0 }, { name: "L", extraPrice: 5000 }] }] },
    { name: "콤비네이션 피자", price: 0, description: "푸짐한 콤비네이션", category: "피자", options: [{ groupName: "사이즈", isRequired: true, maxSelect: 1, items: [{ name: "M", extraPrice: 0 }, { name: "L", extraPrice: 5000 }] }] },
    { name: "고구마 피자", price: 0, description: "달콤한 고구마 무스", category: "피자" },
    { name: "콜라 1.25L", price: 0, description: "시원한 콜라", category: "음료" },
  ],
  BUNSIK: [
    { name: "떡볶이", price: 0, description: "매콤 쫀득", category: "떡볶이" },
    { name: "순대", price: 0, description: "당면 순대", category: "순대" },
    { name: "튀김 모듬", price: 0, description: "야채+고구마+김말이", category: "튀김" },
    { name: "참치 김밥", price: 0, description: "참치마요 김밥", category: "김밥" },
    { name: "라볶이", price: 0, description: "라면+떡볶이", category: "떡볶이" },
  ],
  JAPANESE: [
    { name: "돈코츠 라멘", price: 0, description: "진한 돼지뼈 육수", category: "라멘" },
    { name: "로스카츠", price: 0, description: "바삭한 로스카츠", category: "돈카츠" },
    { name: "연어초밥 8p", price: 0, description: "신선한 연어초밥", category: "초밥" },
    { name: "카레라이스", price: 0, description: "걸쭉한 일본식 카레", category: "카레" },
    { name: "우동", price: 0, description: "쫀득한 사누끼 우동", category: "우동" },
  ],
};
