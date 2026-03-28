"use client"

import Image from "next/image"
import { Minus, Plus } from "lucide-react"
import { Drawer, DrawerContent, DrawerFooter } from "@/shared/ui/drawer"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { Checkbox } from "@/shared/ui/checkbox"
import { formatPrice } from "@/shared/lib"
import type {
  MenuItemData,
  MenuOptionGroupData,
  SelectedOption,
} from "@/entities/menu"
import { useMenuOption } from "../model/useMenuOption"

interface MenuOptionSheetProps {
  menu: MenuItemData
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart: (
    menu: MenuItemData,
    options: SelectedOption[],
    quantity: number,
    optionPrice: number
  ) => void
}

export function MenuOptionSheet({
  menu,
  open,
  onOpenChange,
  onAddToCart,
}: MenuOptionSheetProps) {
  const {
    selectedOptions,
    quantity,
    toggleOption,
    incrementQuantity,
    decrementQuantity,
    isValid,
    getSelectedOptionExtraPrice,
    reset,
  } = useMenuOption()

  const optionPrice = getSelectedOptionExtraPrice(menu.optionGroups)
  const totalPrice = (menu.price + optionPrice) * quantity
  const canSubmit = !menu.isSoldOut && isValid(menu.optionGroups)

  const handleAddToCart = () => {
    if (!canSubmit) return

    // 선택된 옵션을 SelectedOption[] 형태로 변환
    const options: SelectedOption[] = []
    for (const group of menu.optionGroups) {
      const selectedIds = selectedOptions.get(group.id)
      if (!selectedIds) continue
      for (const option of group.options) {
        if (selectedIds.has(option.id)) {
          options.push({
            groupName: group.name,
            optionName: option.name,
            extraPrice: option.extraPrice,
          })
        }
      }
    }

    onAddToCart(menu, options, quantity, optionPrice)
    reset()
    onOpenChange(false)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset()
    onOpenChange(isOpen)
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[70vh]">
        {/* 메뉴 정보 */}
        <div className="flex gap-3 border-b pb-4">
          {menu.imageUrl && (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={menu.imageUrl}
                alt={menu.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex flex-col justify-center">
            <h3 className="text-lg font-bold">{menu.name}</h3>
            {menu.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {menu.description}
              </p>
            )}
            <p className="mt-1 font-semibold">{formatPrice(menu.price)}</p>
          </div>
        </div>

        {/* 품절 표시 */}
        {menu.isSoldOut && (
          <div className="mt-4 rounded-lg bg-muted p-4 text-center">
            <p className="font-medium text-muted-foreground">
              품절된 메뉴입니다
            </p>
          </div>
        )}

        {/* 옵션 그룹 */}
        {!menu.isSoldOut &&
          menu.optionGroups
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((group) => (
              <OptionGroup
                key={group.id}
                group={group}
                selectedIds={selectedOptions.get(group.id) ?? new Set()}
                onToggle={(optionId) =>
                  toggleOption(group.id, optionId, group.maxSelect)
                }
              />
            ))}

        {/* 수량 조정 */}
        {!menu.isSoldOut && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="font-medium">수량</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={incrementQuantity}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>

      <DrawerFooter>
        <Button
          className="w-full h-12 text-base font-bold"
          disabled={!canSubmit}
          onClick={handleAddToCart}
        >
          {menu.isSoldOut
            ? "품절된 메뉴입니다"
            : `${formatPrice(totalPrice)} 장바구니에 담기`}
        </Button>
      </DrawerFooter>
    </Drawer>
  )
}

/** 옵션 그룹 컴포넌트 */
function OptionGroup({
  group,
  selectedIds,
  onToggle,
}: {
  group: MenuOptionGroupData
  selectedIds: Set<string>
  onToggle: (optionId: string) => void
}) {
  const isRadio = group.maxSelect === 1

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold">{group.name}</span>
        {group.isRequired ? (
          <Badge variant="destructive" className="text-[10px] px-1.5 h-4">
            필수
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
            선택
          </Badge>
        )}
        {group.maxSelect > 1 && (
          <span className="text-xs text-muted-foreground">
            (최대 {group.maxSelect}개)
          </span>
        )}
      </div>
      <div className="space-y-1">
        {group.options
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((option) => {
            const isSelected = selectedIds.has(option.id)
            return (
              <button
                key={option.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                onClick={() => onToggle(option.id)}
              >
                {isRadio ? (
                  <RadioIndicator checked={isSelected} />
                ) : (
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(option.id)}
                  />
                )}
                <span className="flex-1 text-left text-sm">{option.name}</span>
                {option.extraPrice > 0 && (
                  <span className="text-sm text-muted-foreground">
                    +{formatPrice(option.extraPrice)}
                  </span>
                )}
              </button>
            )
          })}
      </div>
    </div>
  )
}

/** 라디오 인디케이터 (radio-group 컴포넌트 없으므로 커스텀) */
function RadioIndicator({ checked }: { checked: boolean }) {
  return (
    <div
      className={`size-4 shrink-0 rounded-full border-2 transition-colors ${
        checked ? "border-primary" : "border-input"
      } flex items-center justify-center`}
    >
      {checked && <div className="size-2 rounded-full bg-primary" />}
    </div>
  )
}
