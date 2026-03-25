"use client";

import { MenuItemCard } from "./menu-item-card";
import { Separator } from "@/components/ui/separator";

export interface MenuData {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isSoldOut: boolean;
}

interface MenuSectionProps {
  category: string;
  menus: MenuData[];
  onMenuClick?: (menu: MenuData) => void;
}

export function MenuSection({ category, menus, onMenuClick }: MenuSectionProps) {
  return (
    <section id={`menu-category-${category}`} className="pt-4">
      <h3 className="text-lg font-bold">{category}</h3>
      <div className="divide-y">
        {menus.map((menu) => (
          <MenuItemCard
            key={menu.id}
            id={menu.id}
            name={menu.name}
            description={menu.description}
            price={menu.price}
            imageUrl={menu.imageUrl}
            isSoldOut={menu.isSoldOut}
            onClick={() => onMenuClick?.(menu)}
          />
        ))}
      </div>
      <Separator />
    </section>
  );
}
