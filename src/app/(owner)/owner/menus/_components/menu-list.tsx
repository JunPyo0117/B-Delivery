"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, UtensilsCrossed } from "lucide-react";
import { MenuCard } from "./menu-card";
import { MenuFormDialog } from "./menu-form-dialog";

interface Menu {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isSoldOut: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MenuListProps {
  initialMenus: Menu[];
}

export function MenuList({ initialMenus }: MenuListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editMenu, setEditMenu] = useState<Menu | null>(null);

  // 카테고리별 그룹핑
  const groupedMenus = initialMenus.reduce<Record<string, Menu[]>>(
    (acc, menu) => {
      if (!acc[menu.category]) {
        acc[menu.category] = [];
      }
      acc[menu.category].push(menu);
      return acc;
    },
    {}
  );

  const categories = Object.keys(groupedMenus);

  function handleEdit(menu: Menu) {
    setEditMenu(menu);
    setFormOpen(true);
  }

  function handleCloseForm(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setEditMenu(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">메뉴 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            총 {initialMenus.length}개 메뉴
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          메뉴 등록
        </Button>
      </div>

      {/* 메뉴 목록 */}
      {initialMenus.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border bg-white py-16">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            등록된 메뉴가 없습니다
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            새 메뉴를 등록해보세요
          </p>
          <Button className="mt-4" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            첫 메뉴 등록하기
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </h2>
              <div className="space-y-2">
                {groupedMenus[category].map((menu) => (
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    onEdit={() => handleEdit(menu)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 등록/수정 다이얼로그 */}
      <MenuFormDialog
        open={formOpen}
        onOpenChange={handleCloseForm}
        editMenu={editMenu}
      />
    </div>
  );
}
