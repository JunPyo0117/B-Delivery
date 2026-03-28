"use server"

import { prisma } from "@/shared/api/prisma"
import type { OrderDetailData, OrderItemData, SelectedOption } from "../model/types"

export async function getOrderDetail(
  orderId: string,
  userId: string
): Promise<OrderDetailData | null> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          latitude: true,
          longitude: true,
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
      delivery: {
        include: {
          rider: {
            select: {
              nickname: true,
              riderProfile: {
                select: {
                  transportType: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!order) return null

  return {
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    deliveryFee: order.deliveryFee,
    deliveryAddress: order.deliveryAddress,
    deliveryNote: order.deliveryNote,
    restaurantName: order.restaurant.name,
    restaurantImageUrl: order.restaurant.imageUrl,
    restaurantId: order.restaurant.id,
    restaurantLat: order.restaurant.latitude,
    restaurantLng: order.restaurant.longitude,
    deliveryLat: order.deliveryLat ?? 0,
    deliveryLng: order.deliveryLng ?? 0,
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
    delivery: order.delivery
      ? {
          id: order.delivery.id,
          status: order.delivery.status,
          riderNickname: order.delivery.rider?.nickname ?? null,
          riderTransport:
            order.delivery.rider?.riderProfile?.transportType ?? null,
          estimatedTime: order.delivery.estimatedTime,
        }
      : null,
  }
}
