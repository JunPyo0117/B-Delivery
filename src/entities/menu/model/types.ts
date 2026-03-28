export interface MenuItemData {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  category: string;
  isSoldOut: boolean;
  isPopular: boolean;
  isNew: boolean;
  optionGroups: MenuOptionGroupData[];
}

export interface MenuOptionGroupData {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  sortOrder: number;
  options: MenuOptionData[];
}

export interface MenuOptionData {
  id: string;
  name: string;
  extraPrice: number;
  sortOrder: number;
}

/** 장바구니에 저장될 선택된 옵션 */
export interface SelectedOption {
  groupName: string;
  optionName: string;
  extraPrice: number;
}

/** 메뉴 카테고리별 그룹 (음식점 상세에서 사용) */
export interface MenuCategoryGroup {
  category: string;
  items: MenuItemData[];
}
