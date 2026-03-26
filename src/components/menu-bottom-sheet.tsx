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
  deliveryFee?: number;
  minOrderAmount?: number;
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

  const { addItem, isDifferentRestaurant, replaceWithItem, setDeliveryInfo } = useCartStore();

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
    if (menu.deliveryFee !== undefined && menu.minOrderAmount !== undefined) {
      setDeliveryInfo(menu.deliveryFee, menu.minOrderAmount);
    }
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
    if (menu.deliveryFee !== undefined && menu.minOrderAmount !== undefined) {
      setDeliveryInfo(menu.deliveryFee, menu.minOrderAmount);
    }
    setShowReplaceConfirm(false);
    handleOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      {/* 다른 가게 교체 확인 */}
      {showReplaceConfirm ? (
        <DrawerContent>
          <div className="py-8 text-center">
            <p className="text-base font-bold text-gray-900">
              장바구니에 다른 가게의 메뉴가 있어요
            </p>
            <p className="mt-2 text-sm text-gray-500">
              선택하신 메뉴를 담으려면
              <br />
              기존 장바구니를 비워야 합니다.
            </p>
          </div>
          <DrawerFooter className="flex flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-lg border-gray-200 font-medium text-gray-600"
              onClick={() => setShowReplaceConfirm(false)}
            >
              취소
            </Button>
            <Button
              className="flex-1 rounded-lg bg-[#2DB400] font-medium text-white hover:bg-[#26A000]"
              onClick={handleReplaceCart}
            >
              비우고 담기
            </Button>
          </DrawerFooter>
        </DrawerContent>
      ) : (
        <>
          <DrawerContent>
            {/* 메뉴 이미지 */}
            {menu.imageUrl && (
              <div className="relative mb-4 h-52 w-full overflow-hidden rounded-t-lg bg-gray-100">
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
            <div className="space-y-1.5 px-1">
              <h3 className="text-lg font-bold text-gray-900">{menu.name}</h3>
              {menu.description && (
                <p className="text-[13px] leading-relaxed text-gray-500">
                  {menu.description}
                </p>
              )}
              <p className="text-lg font-bold text-gray-900">
                {menu.price.toLocaleString()}원
              </p>
            </div>

            {/* 수량 선택 */}
            <div className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <span className="text-sm font-medium text-gray-700">수량</span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex size-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors disabled:opacity-30"
                  aria-label="수량 감소"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center text-base font-bold tabular-nums text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  disabled={quantity >= 99}
                  className="flex size-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-colors disabled:opacity-30"
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
              className="w-full rounded-lg bg-[#2DB400] py-6 text-base font-bold text-white hover:bg-[#26A000]"
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
