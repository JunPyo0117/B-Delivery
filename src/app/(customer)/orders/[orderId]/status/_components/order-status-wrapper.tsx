"use client"

import { OrderStatusPage } from "@/pages/order-status"

interface OrderStatusPageWrapperProps {
  orderId: string
}

export function OrderStatusPageWrapper({ orderId }: OrderStatusPageWrapperProps) {
  return <OrderStatusPage orderId={orderId} />
}
