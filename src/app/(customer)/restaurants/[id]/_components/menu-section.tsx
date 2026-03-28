"use client";

import { MenuItemCard } from "./menu-item-card";

export interface OptionGroupData {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  options: { id: string; name: string; extraPrice: number }[];
}

export interface MenuData {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isSoldOut: boolean;
  optionGroups?: OptionGroupData[];
}

interface MenuSectionProps {
  category: string;
  menus: MenuData[];
  onMenuClick?: (menu: MenuData) => void;
  rankStart?: number;
}

export function MenuSection({ category, menus, onMenuClick, rankStart = 0 }: MenuSectionProps) {
  const isPopular = category.includes("인기") || category.includes("추천");

  return (
    <section id={`menu-category-${category}`} className="pt-5 pb-2">
      <div className="mb-1">
        <h3 className="text-[17px] font-bold text-gray-900">{category}</h3>
        {isPopular && (
          <p className="mt-0.5 text-xs text-gray-400">
            한 달간 주문수가 많고 만족도가 높은 메뉴예요.
          </p>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {menus.map((menu, idx) => (
          <MenuItemCard
            key={menu.id}
            id={menu.id}
            name={menu.name}
            description={menu.description}
            price={menu.price}
            imageUrl={menu.imageUrl}
            isSoldOut={menu.isSoldOut}
            rank={isPopular ? rankStart + idx + 1 : undefined}
            reviewCount={undefined}
            onClick={() => onMenuClick?.(menu)}
          />
        ))}
      </div>
    </section>
  );
}
