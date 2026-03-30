"use client"

import { useState, useCallback, useMemo } from "react"
import type { MenuOptionGroupData } from "@/entities/menu"

interface UseMenuOptionReturn {
  selectedOptions: Map<string, Set<string>>
  quantity: number
  toggleOption: (groupId: string, optionId: string, maxSelect: number) => void
  setQuantity: (quantity: number) => void
  incrementQuantity: () => void
  decrementQuantity: () => void
  calculateTotalPrice: (basePrice: number) => number
  isValid: (optionGroups: MenuOptionGroupData[]) => boolean
  getSelectedOptionExtraPrice: (optionGroups: MenuOptionGroupData[]) => number
  reset: () => void
}

export function useMenuOption(): UseMenuOptionReturn {
  const [selectedOptions, setSelectedOptions] = useState<Map<string, Set<string>>>(
    new Map()
  )
  const [quantity, setQuantityState] = useState(1)

  const toggleOption = useCallback(
    (groupId: string, optionId: string, maxSelect: number) => {
      setSelectedOptions((prev) => {
        const next = new Map(prev)
        const groupSet = new Set(next.get(groupId) ?? [])

        if (groupSet.has(optionId)) {
          // 이미 선택된 경우 해제
          groupSet.delete(optionId)
        } else if (maxSelect === 1) {
          // 단일 선택 (라디오): 기존 선택 교체
          groupSet.clear()
          groupSet.add(optionId)
        } else if (groupSet.size < maxSelect) {
          // 다중 선택 (체크박스): maxSelect 미만이면 추가
          groupSet.add(optionId)
        } else {
          // maxSelect 초과: 추가하지 않음
          return prev
        }

        if (groupSet.size === 0) {
          next.delete(groupId)
        } else {
          next.set(groupId, groupSet)
        }
        return next
      })
    },
    []
  )

  const setQuantity = useCallback((q: number) => {
    if (q >= 1) setQuantityState(q)
  }, [])

  const incrementQuantity = useCallback(() => {
    setQuantityState((prev) => prev + 1)
  }, [])

  const decrementQuantity = useCallback(() => {
    setQuantityState((prev) => (prev > 1 ? prev - 1 : 1))
  }, [])

  const getSelectedOptionExtraPrice = useCallback(
    (optionGroups: MenuOptionGroupData[]): number => {
      let total = 0
      for (const group of optionGroups) {
        const selectedIds = selectedOptions.get(group.id)
        if (!selectedIds) continue
        for (const option of group.options) {
          if (selectedIds.has(option.id)) {
            total += option.extraPrice
          }
        }
      }
      return total
    },
    [selectedOptions]
  )

  const calculateTotalPrice = useCallback(
    (basePrice: number): number => {
      // optionGroups 없이 단순 계산 (외부에서 옵션 가격을 더해서 사용)
      return basePrice * quantity
    },
    [quantity]
  )

  const isValid = useCallback(
    (optionGroups: MenuOptionGroupData[]): boolean => {
      for (const group of optionGroups) {
        if (group.isRequired) {
          const selected = selectedOptions.get(group.id)
          if (!selected || selected.size === 0) {
            return false
          }
        }
      }
      return true
    },
    [selectedOptions]
  )

  const reset = useCallback(() => {
    setSelectedOptions(new Map())
    setQuantityState(1)
  }, [])

  return useMemo(
    () => ({
      selectedOptions,
      quantity,
      toggleOption,
      setQuantity,
      incrementQuantity,
      decrementQuantity,
      calculateTotalPrice,
      isValid,
      getSelectedOptionExtraPrice,
      reset,
    }),
    [
      selectedOptions,
      quantity,
      toggleOption,
      setQuantity,
      incrementQuantity,
      decrementQuantity,
      calculateTotalPrice,
      isValid,
      getSelectedOptionExtraPrice,
      reset,
    ]
  )
}
