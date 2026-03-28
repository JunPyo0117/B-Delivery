import type { Metadata } from "next"

import { OrderStatusPageWrapper } from "./_components/order-status-wrapper"

export const metadata: Metadata = {
  title: "주문 상태",
}

export default async function OrderStatusRoute({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params

  return <OrderStatusPageWrapper orderId={orderId} />
}
