"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Minus, Plus, Check } from "lucide-react";
import { Drawer, DrawerContent, DrawerFooter } from "@/shared/ui/drawer";
import { Button } from "@/shared/ui/button";
import { useCartStore, type CartItemOption } from "@/features/cart/model/cartStore";

/** 옵션 그룹 데이터 */
export interface OptionGroup {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  options: { id: string; name: string; extraPrice: number }[];
}

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
  optionGroups?: OptionGroup[];
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
  // 선택된 옵션: groupId -> Set<optionId>
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, Set<string>>
  >({});

  const { addItem, isDifferentRestaurant, replaceWithItem, setDeliveryInfo } =
    useCartStore();

  // 시트가 열릴 때 수량/옵션 초기화
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setQuantity(1);
        setShowReplaceConfirm(false);
        setSelectedOptions({});
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  // 옵션 토글 핸들러
  const handleOptionToggle = useCallback(
    (groupId: string, optionId: string, maxSelect: number) => {
      setSelectedOptions((prev) => {
        const current = new Set(prev[groupId] ?? []);

        if (current.has(optionId)) {
          // 이미 선택된 항목 해제
          current.delete(optionId);
        } else {
          if (maxSelect === 1) {
            // 단일 선택: 기존 선택 대체
            current.clear();
            current.add(optionId);
          } else {
            // 다중 선택: maxSelect 한도 확인
            if (current.size < maxSelect) {
              current.add(optionId);
            }
          }
        }

        return { ...prev, [groupId]: current };
      });
    },
    []
  );

  // 필수 옵션 충족 여부
  const optionGroups = menu?.optionGroups ?? [];
  const allRequiredSelected = useMemo(() => {
    return optionGroups
      .filter((g) => g.isRequired)
      .every((g) => {
        const selected = selectedOptions[g.id];
        return selected && selected.size > 0;
      });
  }, [optionGroups, selectedOptions]);

  // 선택된 옵션의 추가 가격 합산
  const optionExtraPrice = useMemo(() => {
    let total = 0;
    for (const group of optionGroups) {
      const selected = selectedOptions[group.id];
      if (!selected) continue;
      for (const option of group.options) {
        if (selected.has(option.id)) {
          total += option.extraPrice;
        }
      }
    }
    return total;
  }, [optionGroups, selectedOptions]);

  if (!menu) return null;

  const hasOptions = optionGroups.length > 0;
  const unitPrice = menu.price + optionExtraPrice;
  const totalPrice = unitPrice * quantity;

  // 선택된 옵션을 CartItemOption[] 로 변환
  const buildCartOptions = (): CartItemOption[] => {
    const result: CartItemOption[] = [];
    for (const group of optionGroups) {
      const selected = selectedOptions[group.id];
      if (!selected) continue;
      for (const option of group.options) {
        if (selected.has(option.id)) {
          result.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            extraPrice: option.extraPrice,
          });
        }
      }
    }
    return result;
  };

  const cartItemData = () => ({
    menuId: menu.id,
    name: menu.name,
    price: menu.price,
    imageUrl: menu.imageUrl,
    restaurantId: menu.restaurantId,
    restaurantName: menu.restaurantName,
    options: buildCartOptions(),
  });

  const handleAddToCart = () => {
    // 다른 가게 메뉴가 이미 담겨 있는지 확인
    if (isDifferentRestaurant(menu.restaurantId)) {
      setShowReplaceConfirm(true);
      return;
    }

    addItem(cartItemData(), quantity);
    if (menu.deliveryFee !== undefined && menu.minOrderAmount !== undefined) {
      setDeliveryInfo(menu.deliveryFee, menu.minOrderAmount);
    }
    handleOpenChange(false);
  };

  const handleReplaceCart = () => {
    replaceWithItem(cartItemData(), quantity);
    if (menu.deliveryFee !== undefined && menu.minOrderAmount !== undefined) {
      setDeliveryInfo(menu.deliveryFee, menu.minOrderAmount);
    }
    setShowReplaceConfirm(false);
    handleOpenChange(false);
  };

  // 필수 옵션 미선택 시 담기 불가
  const canAddToCart = !hasOptions || allRequiredSelected;

  // 미충족 필수 그룹 수 계산
  const unselectedRequiredCount = optionGroups.filter(
    (g) => g.isRequired && !(selectedOptions[g.id]?.size > 0)
  ).length;

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
            <div className="max-h-[70dvh] overflow-y-auto">
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

              {/* 옵션 그룹들 */}
              {optionGroups.length > 0 && (
                <div className="mt-5 space-y-4">
                  {optionGroups.map((group) => {
                    const selected = selectedOptions[group.id] ?? new Set();
                    return (
                      <div key={group.id} className="rounded-lg border border-gray-200 px-3 py-3">
                        {/* 그룹 헤더 */}
                        <div className="mb-2.5 flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {group.name}
                          </span>
                          {group.isRequired ? (
                            <span className="rounded bg-[#2DB400]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#2DB400]">
                              필수
                            </span>
                          ) : (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                              선택
                            </span>
                          )}
                          {group.maxSelect > 1 && (
                            <span className="text-[11px] text-gray-400">
                              (최대 {group.maxSelect}개)
                            </span>
                          )}
                        </div>

                        {/* 옵션 목록 */}
                        <div className="space-y-0 divide-y divide-gray-100">
                          {group.options.map((option) => {
                            const isSelected = selected.has(option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() =>
                                  handleOptionToggle(
                                    group.id,
                                    option.id,
                                    group.maxSelect
                                  )
                                }
                                className="flex w-full items-center justify-between py-2.5 text-left transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  {/* 체크 아이콘 */}
                                  <div
                                    className={`flex size-5 items-center justify-center rounded-full border transition-colors ${
                                      isSelected
                                        ? "border-[#2DB400] bg-[#2DB400]"
                                        : "border-gray-300 bg-white"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="size-3 text-white" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-[13px] ${
                                      isSelected
                                        ? "font-semibold text-gray-900"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {option.name}
                                  </span>
                                </div>
                                {option.extraPrice > 0 && (
                                  <span className="text-[12px] text-gray-500">
                                    +{option.extraPrice.toLocaleString()}원
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

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
            </div>
          </DrawerContent>

          {/* 장바구니 담기 버튼 */}
          <DrawerFooter>
            {!canAddToCart && (
              <p className="mb-1 text-center text-[12px] text-[#FF5252]">
                필수 옵션 {unselectedRequiredCount}개를 선택해 주세요
              </p>
            )}
            <Button
              className="w-full rounded-lg bg-[#2DB400] py-6 text-base font-bold text-white hover:bg-[#26A000] disabled:bg-gray-300 disabled:text-gray-500"
              size="lg"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
            >
              {totalPrice.toLocaleString()}원 담기
            </Button>
          </DrawerFooter>
        </>
      )}
    </Drawer>
  );
}
