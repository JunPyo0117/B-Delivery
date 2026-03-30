"use server"

import { createOrder } from "@/entities/order/api/createOrder"
import { auth } from "@/auth"
import type { CreateOrderInput, CreateOrderItemInput } from "@/entities/order/model/types"

interface PlaceOrderInput {
  restaurantId: string
  deliveryAddress: string
  deliveryLat: number
  deliveryLng: number
  deliveryNote?: string
  items: {
    menuId: string
    quantity: number
    price: number
    optionPrice: number
    selectedOptions: {
      groupName: string
      optionName: string
      extraPrice: number
    }[]
  }[]
}

interface PlaceOrderResult {
  success: boolean
  orderId?: string
  error?: string
}

export async function placeOrder(
  input: PlaceOrderInput
): Promise<PlaceOrderResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: "로그인이 필요합니다." }
  }

  const orderInput: CreateOrderInput = {
    restaurantId: input.restaurantId,
    deliveryAddress: input.deliveryAddress,
    deliveryLat: input.deliveryLat,
    deliveryLng: input.deliveryLng,
    deliveryNote: input.deliveryNote,
    items: input.items.map(
      (item): CreateOrderItemInput => ({
        menuId: item.menuId,
        quantity: item.quantity,
        price: item.price,
        optionPrice: item.optionPrice,
        selectedOptions: item.selectedOptions,
      })
    ),
  }

  return createOrder(session.user.id, orderInput)
}
