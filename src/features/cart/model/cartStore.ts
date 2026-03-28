"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SelectedOption } from "@/entities/menu"

export interface CartItem {
  menuId: string
  menuName: string
  menuImageUrl: string | null
  price: number // 메뉴 기본 가격
  optionPrice: number // 선택 옵션 추가 금액 합계
  selectedOptions: SelectedOption[]
  quantity: number
}

interface CartState {
  items: CartItem[]
  restaurantId: string | null
  restaurantName: string | null
  deliveryFee: number
  minOrderAmount: number

  // actions
  addItem: (
    restaurantId: string,
    restaurantName: string,
    deliveryFee: number,
    minOrderAmount: number,
    item: CartItem
  ) => boolean
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clearCart: () => void
  replaceWithItem: (
    restaurantId: string,
    restaurantName: string,
    deliveryFee: number,
    minOrderAmount: number,
    item: CartItem
  ) => void

  // computed
  totalItemPrice: () => number
  totalPrice: () => number
  itemCount: () => number
  meetsMinOrder: () => boolean
}

/** 두 옵션 배열이 동일한지 비교 */
function isSameOptions(
  a: SelectedOption[],
  b: SelectedOption[]
): boolean {
  if (a.length !== b.length) return false
  const sortFn = (x: SelectedOption, y: SelectedOption) =>
    `${x.groupName}-${x.optionName}`.localeCompare(
      `${y.groupName}-${y.optionName}`
    )
  const sortedA = [...a].sort(sortFn)
  const sortedB = [...b].sort(sortFn)
  return sortedA.every(
    (opt, i) =>
      opt.groupName === sortedB[i].groupName &&
      opt.optionName === sortedB[i].optionName &&
      opt.extraPrice === sortedB[i].extraPrice
  )
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      deliveryFee: 0,
      minOrderAmount: 0,

      addItem: (restaurantId, restaurantName, deliveryFee, minOrderAmount, item) => {
        const state = get()

        // 다른 가게 메뉴가 이미 있으면 추가하지 않고 false 반환
        if (state.items.length > 0 && state.restaurantId !== restaurantId) {
          return false
        }

        // 같은 메뉴 + 같은 옵션이면 수량 증가
        const existingIndex = state.items.findIndex(
          (existing) =>
            existing.menuId === item.menuId &&
            isSameOptions(existing.selectedOptions, item.selectedOptions)
        )

        if (existingIndex !== -1) {
          const newItems = [...state.items]
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + item.quantity,
          }
          set({
            items: newItems,
            restaurantId,
            restaurantName,
            deliveryFee,
            minOrderAmount,
          })
        } else {
          set({
            items: [...state.items, item],
            restaurantId,
            restaurantName,
            deliveryFee,
            minOrderAmount,
          })
        }

        return true
      },

      removeItem: (index) => {
        const state = get()
        const newItems = state.items.filter((_, i) => i !== index)
        if (newItems.length === 0) {
          set({
            items: [],
            restaurantId: null,
            restaurantName: null,
            deliveryFee: 0,
            minOrderAmount: 0,
          })
        } else {
          set({ items: newItems })
        }
      },

      updateQuantity: (index, quantity) => {
        if (quantity <= 0) {
          get().removeItem(index)
          return
        }
        set((state) => ({
          items: state.items.map((item, i) =>
            i === index ? { ...item, quantity } : item
          ),
        }))
      },

      clearCart: () =>
        set({
          items: [],
          restaurantId: null,
          restaurantName: null,
          deliveryFee: 0,
          minOrderAmount: 0,
        }),

      replaceWithItem: (
        restaurantId,
        restaurantName,
        deliveryFee,
        minOrderAmount,
        item
      ) => {
        set({
          items: [item],
          restaurantId,
          restaurantName,
          deliveryFee,
          minOrderAmount,
        })
      },

      totalItemPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.price + item.optionPrice) * item.quantity,
          0
        )
      },

      totalPrice: () => {
        const state = get()
        return state.totalItemPrice() + state.deliveryFee
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      meetsMinOrder: () => {
        const state = get()
        return state.totalItemPrice() >= state.minOrderAmount
      },
    }),
    {
      name: "bdelivery-cart",
    }
  )
)
