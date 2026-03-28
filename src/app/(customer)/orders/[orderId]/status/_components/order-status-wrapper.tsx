"use client"

import { OrderStatusPage } from "@/views/order-status"

interface OrderStatusPageWrapperProps {
  orderId: string
}

export function OrderStatusPageWrapper({ orderId }: OrderStatusPageWrapperProps) {
  return <OrderStatusPage orderId={orderId} />
}
