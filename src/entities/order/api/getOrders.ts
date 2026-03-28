"use server"

import { prisma } from "@/lib/prisma"
import type { OrderCardData, OrderItemData, SelectedOption } from "../model/types"
import { DELIVERING_STATUSES, COMPLETED_STATUSES } from "../model/types"

const PAGE_SIZE = 20

interface GetOrdersParams {
  userId: string
  tab: "delivering" | "completed"
  cursor?: string
}

interface GetOrdersResult {
  orders: OrderCardData[]
  nextCursor: string | null
}

export async function getOrders({
  userId,
  tab,
  cursor,
}: GetOrdersParams): Promise<GetOrdersResult> {
  const statusFilter =
    tab === "delivering" ? DELIVERING_STATUSES : COMPLETED_STATUSES

  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: { in: statusFilter },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      restaurant: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
      items: {
        include: {
          menu: {
            select: {
              name: true,
            },
          },
        },
      },
      review: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
  })

  const hasMore = orders.length > PAGE_SIZE
  const sliced = hasMore ? orders.slice(0, PAGE_SIZE) : orders

  const result: OrderCardData[] = sliced.map((order) => ({
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    deliveryFee: order.deliveryFee,
    deliveryAddress: order.deliveryAddress,
    deliveryNote: order.deliveryNote,
    restaurantName: order.restaurant.name,
    restaurantImageUrl: order.restaurant.imageUrl,
    items: order.items.map(
      (item): OrderItemData => ({
        id: item.id,
        menuName: item.menu.name,
        quantity: item.quantity,
        price: item.price,
        optionPrice: item.optionPrice,
        selectedOptions: item.selectedOptions as SelectedOption[] | null,
      })
    ),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    hasReview: !!order.review,
  }))

  return {
    orders: result,
    nextCursor: hasMore
      ? sliced[sliced.length - 1].createdAt.toISOString()
      : null,
  }
}
