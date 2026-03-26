"use client";

import { useState } from "react";
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
    <div>
      {/* Green header */}
      <div
        className="px-4 py-4 flex items-center justify-between"
        style={{ backgroundColor: "#2DB400" }}
      >
        <div>
          <h1 className="text-lg font-bold text-white">메뉴 관리</h1>
          <p className="text-xs text-white/70 mt-0.5">
            총 {initialMenus.length}개 메뉴
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            color: "white",
          }}
        >
          <Plus className="h-4 w-4" />
          메뉴 추가
        </button>
      </div>

      {/* 메뉴 목록 */}
      <div className="p-4">
        {initialMenus.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16">
            <UtensilsCrossed className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-base font-medium text-gray-500">
              등록된 메뉴가 없습니다
            </p>
            <p className="mt-1 text-sm text-gray-400">
              새 메뉴를 등록해보세요
            </p>
            <button
              className="mt-4 flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "#2DB400" }}
              onClick={() => setFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              첫 메뉴 등록하기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {category}
                </h2>
                <div className="rounded-xl border bg-white overflow-hidden divide-y divide-gray-100">
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
      </div>

      {/* 등록/수정 다이얼로그 */}
      <MenuFormDialog
        open={formOpen}
        onOpenChange={handleCloseForm}
        editMenu={editMenu}
      />
    </div>
  );
}
