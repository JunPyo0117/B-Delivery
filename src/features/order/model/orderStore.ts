"use client"

import { create } from "zustand"
import type { OrderStatus } from "@/generated/prisma/client"

interface OrderStatusEntry {
  status: OrderStatus
  updatedAt: string
}

interface OrderState {
  statuses: Record<string, OrderStatusEntry>
  riderLocation: { lat: number; lng: number; estimatedMinutes: number } | null
  setStatus: (orderId: string, status: OrderStatus) => void
  setRiderLocation: (loc: { lat: number; lng: number; estimatedMinutes: number } | null) => void
  clearAll: () => void
}

export const useOrderStore = create<OrderState>()((set) => ({
  statuses: {},
  riderLocation: null,

  setStatus: (orderId, status) =>
    set((state) => ({
      statuses: {
        ...state.statuses,
        [orderId]: { status, updatedAt: new Date().toISOString() },
      },
    })),

  setRiderLocation: (loc) => set({ riderLocation: loc }),

  clearAll: () => set({ statuses: {}, riderLocation: null }),
}))
