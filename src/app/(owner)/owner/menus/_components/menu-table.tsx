"use client";

import { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import { Plus, UtensilsCrossed, MoreVertical, Pencil, Trash2, Loader2, ImageIcon } from "lucide-react";
import { MenuImportDialog } from "./menu-import-dialog";
import { Switch } from "@/shared/ui/switch";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { toggleSoldOut, deleteMenu, type MenuWithOptions } from "../actions";
import { MenuSlidePanel } from "./menu-slide-panel";

interface MenuTableProps {
  initialMenus: MenuWithOptions[];
}

export function MenuTable({ initialMenus }: MenuTableProps) {
  const [activeCategory, setActiveCategory] = useState<string>("전체");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editMenu, setEditMenu] = useState<MenuWithOptions | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuWithOptions | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState("");

  // 카테고리 목록 추출
  const categories = [
    "전체",
    ...Array.from(new Set(initialMenus.map((m) => m.category).filter(Boolean))),
  ];

  // 필터링된 메뉴 목록
  const filteredMenus =
    activeCategory === "전체"
      ? initialMenus
      : initialMenus.filter((m) => m.category === activeCategory);

  function handleAddMenu() {
    setEditMenu(null);
    setPanelOpen(true);
  }

  function handleEditMenu(menu: MenuWithOptions) {
    setEditMenu(menu);
    setPanelOpen(true);
    setOpenDropdownId(null);
  }

  function handleClosePanel() {
    setPanelOpen(false);
    setEditMenu(null);
  }

  function handleDeleteClick(menu: MenuWithOptions) {
    setDeleteTarget(menu);
    setDeleteError("");
    setOpenDropdownId(null);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const result = await deleteMenu(deleteTarget.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      setDeleteTarget(null);
    });
  }

  const handleDropdownToggle = useCallback((menuId: string) => {
    setOpenDropdownId((prev) => (prev === menuId ? null : menuId));
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">메뉴 관리</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            총 {initialMenus.length}개 메뉴
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MenuImportDialog />
          <Button
            onClick={handleAddMenu}
            className="bg-[#2DB400] text-white hover:bg-[#249a00]"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            메뉴 추가
          </Button>
        </div>
      </div>

      {/* 카테고리 탭 */}
      {categories.length > 1 && (
        <div className="flex gap-1 border-b px-6 py-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[#2DB400] text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 테이블 영역 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {filteredMenus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <UtensilsCrossed className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-base font-medium text-gray-500">
              {activeCategory === "전체"
                ? "등록된 메뉴가 없습니다"
                : `"${activeCategory}" 카테고리에 메뉴가 없습니다`}
            </p>
            <p className="mt-1 text-sm text-gray-400">새 메뉴를 등록해보세요</p>
            <Button
              className="mt-4 bg-[#2DB400] text-white hover:bg-[#249a00]"
              onClick={handleAddMenu}
            >
              <Plus className="h-4 w-4" />
              첫 메뉴 등록하기
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 w-16">썸네일</th>
                  <th className="px-4 py-3">메뉴명</th>
                  <th className="px-4 py-3 w-28">카테고리</th>
                  <th className="px-4 py-3 w-28 text-right">가격</th>
                  <th className="px-4 py-3 w-16 text-center">품절</th>
                  <th className="px-4 py-3 w-24">뱃지</th>
                  <th className="px-4 py-3 w-12 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredMenus.map((menu) => (
                  <MenuTableRow
                    key={menu.id}
                    menu={menu}
                    onEdit={() => handleEditMenu(menu)}
                    onDelete={() => handleDeleteClick(menu)}
                    isDropdownOpen={openDropdownId === menu.id}
                    onDropdownToggle={() => handleDropdownToggle(menu.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 슬라이드 패널 */}
      <MenuSlidePanel
        open={panelOpen}
        onClose={handleClosePanel}
        editMenu={editMenu}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>메뉴 삭제</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.name}&quot; 메뉴를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p className="text-sm font-medium text-destructive">{deleteError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 테이블 행 컴포넌트 ─────────────────────────────

interface MenuTableRowProps {
  menu: MenuWithOptions;
  onEdit: () => void;
  onDelete: () => void;
  isDropdownOpen: boolean;
  onDropdownToggle: () => void;
}

function MenuTableRow({
  menu,
  onEdit,
  onDelete,
  isDropdownOpen,
  onDropdownToggle,
}: MenuTableRowProps) {
  const [isSoldOut, setIsSoldOut] = useState(menu.isSoldOut);
  const [isPending, startTransition] = useTransition();

  function handleToggleSoldOut() {
    startTransition(async () => {
      const result = await toggleSoldOut(menu.id);
      if (!result.error) {
        setIsSoldOut(result.isSoldOut!);
      }
    });
  }

  const formattedPrice = menu.price.toLocaleString("ko-KR");
  const optionCount = menu.optionGroups.reduce(
    (acc: number, g) => acc + g.options.length,
    0
  );

  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-gray-50"
      onClick={onEdit}
    >
      {/* 썸네일 */}
      <td className="px-4 py-3">
        <div
          className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 ${
            isSoldOut ? "opacity-50" : ""
          }`}
        >
          {menu.imageUrl ? (
            <Image
              src={menu.imageUrl}
              alt={menu.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>
      </td>

      {/* 메뉴명 */}
      <td className="px-4 py-3">
        <div className={isSoldOut ? "opacity-50" : ""}>
          <p className="text-sm font-semibold text-gray-900">{menu.name}</p>
          {menu.description && (
            <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
              {menu.description}
            </p>
          )}
          {optionCount > 0 && (
            <p className="mt-0.5 text-xs text-[#2DB400]">
              옵션 {menu.optionGroups.length}그룹 / {optionCount}개
            </p>
          )}
        </div>
      </td>

      {/* 카테고리 */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {menu.category}
        </span>
      </td>

      {/* 가격 */}
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-semibold ${isSoldOut ? "text-gray-400" : "text-gray-900"}`}>
          {formattedPrice}원
        </span>
      </td>

      {/* 품절 토글 */}
      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={!isSoldOut}
          onCheckedChange={handleToggleSoldOut}
          disabled={isPending}
          className={!isSoldOut ? "bg-[#2DB400]" : ""}
        />
      </td>

      {/* 뱃지 */}
      <td className="px-4 py-3">
        <div className="flex gap-1">
          {menu.isNew && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#2DB400]">
              NEW
            </span>
          )}
          {menu.isPopular && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white bg-orange-500">
              인기
            </span>
          )}
          {isSoldOut && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500">
              품절
            </span>
          )}
        </div>
      </td>

      {/* 액션 드롭다운 */}
      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            onClick={onDropdownToggle}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {isDropdownOpen && (
            <>
              {/* 배경 클릭 시 닫기 */}
              <div
                className="fixed inset-0 z-10"
                onClick={onDropdownToggle}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-32 overflow-hidden rounded-lg border bg-white shadow-lg">
                <button
                  onClick={onEdit}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  수정
                </button>
                <button
                  onClick={onDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
