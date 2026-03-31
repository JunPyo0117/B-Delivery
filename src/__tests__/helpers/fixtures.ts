/** 테스트용 공통 데이터 */

export const RESTAURANT = {
  id: "restaurant-1",
  name: "테스트 음식점",
  ownerId: "owner-1",
  category: "KOREAN",
  latitude: 37.5665,
  longitude: 126.978,
  deliveryFee: 3000,
  minOrderAmount: 12000,
  isOpen: true,
} as const;

export const MENU_ITEM = {
  id: "menu-1",
  name: "김치찌개",
  price: 9000,
  restaurantId: RESTAURANT.id,
  isSoldOut: false,
  imageUrl: null,
} as const;

export const MENU_ITEM_SOLDOUT = {
  ...MENU_ITEM,
  id: "menu-2",
  name: "된장찌개",
  isSoldOut: true,
} as const;

export const ORDER = {
  id: "order-1",
  userId: "user-1",
  restaurantId: RESTAURANT.id,
  status: "PENDING" as const,
  totalPrice: 12000,
  deliveryFee: 3000,
  deliveryAddress: "서울시 강남구",
  deliveryLat: 37.4979,
  deliveryLng: 127.0276,
  deliveryNote: null,
  cancelReason: null,
  cancelledBy: null,
  createdAt: new Date("2026-03-31"),
  updatedAt: new Date("2026-03-31"),
  restaurant: {
    ownerId: RESTAURANT.ownerId,
    name: RESTAURANT.name,
    latitude: RESTAURANT.latitude,
    longitude: RESTAURANT.longitude,
  },
} as const;

export const DELIVERY = {
  id: "delivery-1",
  orderId: ORDER.id,
  riderId: null,
  status: "REQUESTED" as const,
  pickupLat: RESTAURANT.latitude,
  pickupLng: RESTAURANT.longitude,
  dropoffLat: 37.4979,
  dropoffLng: 127.0276,
  distance: 3.5,
  estimatedTime: 15,
  riderFee: 4000,
  acceptedAt: null,
  pickedUpAt: null,
  completedAt: null,
  createdAt: new Date("2026-03-31"),
  updatedAt: new Date("2026-03-31"),
} as const;

export const CHAT = {
  id: "chat-1",
  chatType: "CUSTOMER_SUPPORT" as const,
  status: "ACTIVE" as const,
  orderId: ORDER.id,
  userId: "user-1",
  adminId: "admin-1",
  category: "주문문의",
  createdAt: new Date("2026-03-31"),
  updatedAt: new Date("2026-03-31"),
} as const;
