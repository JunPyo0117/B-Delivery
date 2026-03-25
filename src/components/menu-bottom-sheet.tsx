"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Drawer, DrawerContent, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart";

/** 메뉴 바텀시트에 표시할 메뉴 데이터 */
export interface MenuSheetData {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  restaurantId: string;
  restaurantName: string;
}

interface MenuBottomSheetProps {
  menu: MenuSheetData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuBottomSheet({
  menu,
  open,
  onOpenChange,
}: MenuBottomSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);

  const { addItem, isDifferentRestaurant, replaceWithItem } = useCartStore();

  // 시트가 열릴 때 수량 초기화
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setQuantity(1);
        setShowReplaceConfirm(false);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  if (!menu) return null;

  const totalPrice = menu.price * quantity;

  const handleAddToCart = () => {
    // 다른 가게 메뉴가 이미 담겨 있는지 확인
    if (isDifferentRestaurant(menu.restaurantId)) {
      setShowReplaceConfirm(true);
      return;
    }

    addItem(
      {
        menuId: menu.id,
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl,
        restaurantId: menu.restaurantId,
        restaurantName: menu.restaurantName,
      },
      quantity
    );
    handleOpenChange(false);
  };

  const handleReplaceCart = () => {
    replaceWithItem(
      {
        menuId: menu.id,
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl,
        restaurantId: menu.restaurantId,
        restaurantName: menu.restaurantName,
      },
      quantity
    );
    setShowReplaceConfirm(false);
    handleOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      {/* 다른 가게 교체 확인 */}
      {showReplaceConfirm ? (
        <DrawerContent>
          <div className="py-6 text-center">
            <p className="text-base font-semibold">
              장바구니에 다른 가게의 메뉴가 있어요
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              선택하신 메뉴를 담으려면
              <br />
              기존 장바구니를 비워야 합니다.
            </p>
          </div>
          <DrawerFooter className="flex flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowReplaceConfirm(false)}
            >
              취소
            </Button>
            <Button className="flex-1" onClick={handleReplaceCart}>
              비우고 담기
            </Button>
          </DrawerFooter>
        </DrawerContent>
      ) : (
        <>
          <DrawerContent>
            {/* 메뉴 이미지 */}
            {menu.imageUrl && (
              <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={menu.imageUrl}
                  alt={menu.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            )}

            {/* 메뉴 정보 */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{menu.name}</h3>
              {menu.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {menu.description}
                </p>
              )}
              <p className="text-lg font-semibold">
                {menu.price.toLocaleString()}원
              </p>
            </div>

            {/* 수량 선택 */}
            <div className="mt-6 flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium">수량</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex size-8 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
                  aria-label="수량 감소"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center text-base font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  disabled={quantity >= 99}
                  className="flex size-8 items-center justify-center rounded-full border transition-colors disabled:opacity-30"
                  aria-label="수량 증가"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </DrawerContent>

          {/* 장바구니 담기 버튼 */}
          <DrawerFooter>
            <Button
              className="w-full py-6 text-base font-semibold"
              size="lg"
              onClick={handleAddToCart}
            >
              {totalPrice.toLocaleString()}원 담기
            </Button>
          </DrawerFooter>
        </>
      )}
    </Drawer>
  );
}
