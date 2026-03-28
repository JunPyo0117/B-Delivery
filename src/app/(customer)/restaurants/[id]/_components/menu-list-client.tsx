"use client";

import { useState } from "react";
import { MenuSection, type MenuData } from "./menu-section";
import {
  MenuBottomSheet,
  type MenuSheetData,
} from "@/components/menu-bottom-sheet";
import { CartFloatingBar } from "@/app/(customer)/cart/_components/cart-floating-bar";

interface MenuListClientProps {
  menusByCategory: Record<string, MenuData[]>;
  categories: string[];
  restaurantId: string;
  restaurantName: string;
  deliveryFee: number;
  minOrderAmount: number;
}

export function MenuListClient({
  menusByCategory,
  categories,
  restaurantId,
  restaurantName,
  deliveryFee,
  minOrderAmount,
}: MenuListClientProps) {
  const [selectedMenu, setSelectedMenu] = useState<MenuSheetData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleMenuClick = (menu: MenuData) => {
    setSelectedMenu({
      id: menu.id,
      name: menu.name,
      price: menu.price,
      description: menu.description,
      imageUrl: menu.imageUrl,
      restaurantId,
      restaurantName,
      deliveryFee,
      minOrderAmount,
      optionGroups: menu.optionGroups ?? [],
    });
    setSheetOpen(true);
  };

  return (
    <>
      <div className="px-4">
        {categories.map((category) => (
          <MenuSection
            key={category}
            category={category}
            menus={menusByCategory[category]}
            onMenuClick={handleMenuClick}
          />
        ))}
      </div>

      <MenuBottomSheet
        menu={selectedMenu}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <CartFloatingBar hidden={sheetOpen} />
    </>
  );
}
