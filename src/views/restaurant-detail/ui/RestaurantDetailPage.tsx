"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Star,
  ChevronRight,
  ShoppingCart,
  Loader2,
  MessageSquare,
} from "lucide-react"

import { getRestaurantDetail } from "@/entities/restaurant/api/getRestaurantDetail"
import {
  RestaurantInfo,
  type RestaurantDetailData,
  type RestaurantDetailResult,
} from "@/entities/restaurant"
import { MenuItemCard, type MenuItemData, type MenuCategoryGroup } from "@/entities/menu"
import { FavoriteButton } from "@/features/favorite"
import { checkFavorite } from "@/features/favorite/api/checkFavorite"
import { MenuOptionSheet } from "@/features/menu-option"
import {
  useCartStore,
  DifferentRestaurantDialog,
  type CartItem,
} from "@/features/cart"
import type { SelectedOption } from "@/entities/menu"
import { formatPrice, cn } from "@/shared/lib"

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface RestaurantDetailPageProps {
  restaurantId: string
}

type MenuTab = "popular" | "new" | "all"

// ────────────────────────────────────────────
// RestaurantDetailPage
// ────────────────────────────────────────────

export function RestaurantDetailPage({
  restaurantId,
}: RestaurantDetailPageProps) {
  const router = useRouter()

  // 데이터 로딩 상태
  const [data, setData] = useState<RestaurantDetailResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)

  // 메뉴 탭
  const [activeTab, setActiveTab] = useState<MenuTab>("all")

  // 메뉴 옵션 시트
  const [selectedMenu, setSelectedMenu] = useState<MenuItemData | null>(null)
  const [menuSheetOpen, setMenuSheetOpen] = useState(false)

  // 다른 가게 다이얼로그
  const [showDifferentDialog, setShowDifferentDialog] = useState(false)
  const [pendingCartItem, setPendingCartItem] = useState<{
    menu: MenuItemData
    options: SelectedOption[]
    quantity: number
    optionPrice: number
  } | null>(null)

  // 장바구니 스토어
  const cart = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // ── 데이터 로드 ──
  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [detailResult, favoriteResult] = await Promise.all([
          getRestaurantDetail(restaurantId),
          checkFavorite({ restaurantId }),
        ])
        if (!cancelled) {
          setData(detailResult)
          setIsFavorited(favoriteResult)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [restaurantId])

  // ── 장바구니 담기 핸들러 ──
  const handleAddToCart = useCallback(
    (
      menu: MenuItemData,
      options: SelectedOption[],
      quantity: number,
      optionPrice: number,
    ) => {
      if (!data) return

      const cartItem: CartItem = {
        menuId: menu.id,
        menuName: menu.name,
        menuImageUrl: menu.imageUrl,
        price: menu.price,
        optionPrice,
        selectedOptions: options,
        quantity,
      }

      const added = cart.addItem(
        data.restaurant.id,
        data.restaurant.name,
        data.restaurant.deliveryFee,
        data.restaurant.minOrderAmount,
        cartItem,
      )

      if (!added) {
        // 다른 가게 메뉴가 있음
        setPendingCartItem({ menu, options, quantity, optionPrice })
        setShowDifferentDialog(true)
      }
    },
    [data, cart],
  )

  // ── 다른 가게 장바구니 교체 ──
  const handleReplaceCart = useCallback(() => {
    if (!data || !pendingCartItem) return

    const cartItem: CartItem = {
      menuId: pendingCartItem.menu.id,
      menuName: pendingCartItem.menu.name,
      menuImageUrl: pendingCartItem.menu.imageUrl,
      price: pendingCartItem.menu.price,
      optionPrice: pendingCartItem.optionPrice,
      selectedOptions: pendingCartItem.options,
      quantity: pendingCartItem.quantity,
    }

    cart.replaceWithItem(
      data.restaurant.id,
      data.restaurant.name,
      data.restaurant.deliveryFee,
      data.restaurant.minOrderAmount,
      cartItem,
    )

    setPendingCartItem(null)
    setShowDifferentDialog(false)
  }, [data, pendingCartItem, cart])

  // ── 메뉴 클릭 핸들러 ──
  const handleMenuClick = useCallback((item: MenuItemData) => {
    if (item.isSoldOut) return

    if (item.optionGroups.length > 0) {
      // 옵션이 있으면 시트 열기
      setSelectedMenu(item)
      setMenuSheetOpen(true)
    } else {
      // 옵션 없으면 바로 담기
      handleAddToCart(item, [], 1, 0)
    }
  }, [handleAddToCart])

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="size-8 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white gap-3">
        <p className="text-sm text-gray-500">음식점을 찾을 수 없습니다</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#2DB400] font-medium"
        >
          뒤로 가기
        </button>
      </div>
    )
  }

  const { restaurant, menuGroups } = data

  // 메뉴 필터링
  const allMenuItems: MenuItemData[] = menuGroups.flatMap((g) => g.items)
  const popularMenus = allMenuItems.filter((m) => m.isPopular)
  const newMenus = allMenuItems.filter((m) => m.isNew)

  // 탭별 표시 메뉴
  const getFilteredContent = () => {
    switch (activeTab) {
      case "popular":
        return popularMenus
      case "new":
        return newMenus
      case "all":
        return null // 카테고리별 그룹으로 표시
    }
  }

  const filteredMenus = getFilteredContent()

  // 장바구니 수량
  const cartItemCount = mounted ? cart.itemCount() : 0
  const cartTotalPrice = mounted ? cart.totalItemPrice() : 0

  // 리뷰 미리보기 데이터 (상세 API에서 제공하지 않으므로 집계 데이터만)
  const avgRating = restaurant.rating
  const reviewCount = restaurant.reviewCount

  return (
    <div className="flex min-h-screen flex-col bg-white pb-24">
      {/* ── 헤더 이미지 ── */}
      <div className="relative h-[220px] w-full bg-muted">
        {restaurant.imageUrl ? (
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            이미지 없음
          </div>
        )}

        {/* 상단 그라데이션 */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

        {/* 네비게이션 */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3">
          <button
            onClick={() => router.back()}
            className="flex size-9 items-center justify-center rounded-full text-white"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative flex size-9 items-center justify-center rounded-full text-white"
              aria-label="장바구니"
            >
              <ShoppingCart className="size-5" />
              {mounted && cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#2DB400] text-[10px] font-bold text-white">
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ── 음식점 정보 ── */}
      <div className="px-4">
        <div className="pt-5 pb-1">
          {/* 배민클럽 배지 */}
          <div className="mb-2 flex items-center gap-1.5">
            <span className="rounded bg-[#2DB400]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#2DB400]">
              배민클럽
            </span>
            <span className="text-xs text-muted-foreground">배달팁 무료</span>
          </div>

          {/* 가게명 + 찜 */}
          <div className="flex items-start justify-between">
            <h1 className="text-[20px] font-bold leading-tight">
              {restaurant.name}
            </h1>
            <FavoriteButton
              restaurantId={restaurant.id}
              initialFavorite={isFavorited}
            />
          </div>

          {/* 별점 */}
          <div className="mt-2 flex items-center justify-between">
            <Link
              href={`/restaurants/${restaurant.id}/reviews`}
              className="flex items-center gap-1"
            >
              <Star className="size-4 fill-[#FFB300] text-[#FFB300]" />
              <span className="text-sm font-bold">
                {avgRating > 0 ? avgRating.toFixed(1) : "-"}
              </span>
              {reviewCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({reviewCount})
                </span>
              )}
              <ChevronRight className="size-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        <div className="my-3 h-px bg-gray-100" />

        {/* 배달 정보 */}
        <div className="space-y-0 py-2">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-500">최소주문</span>
            <span className="text-sm font-medium">
              {formatPrice(restaurant.minOrderAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-500">배달비</span>
            <span className="text-sm font-medium">
              {restaurant.deliveryFee > 0
                ? formatPrice(restaurant.deliveryFee)
                : "무료"}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-500">배달시간</span>
            <span className="text-sm font-medium">
              {restaurant.deliveryTime}~{restaurant.deliveryTime + 10}분
            </span>
          </div>
        </div>

        <div className="my-3 h-px bg-gray-100" />

        {/* ── 리뷰 미리보기 ── */}
        <div className="py-1">
          <Link
            href={`/restaurants/${restaurant.id}/reviews`}
            className="flex items-center justify-between py-2"
          >
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-4",
                    i < Math.round(avgRating)
                      ? "fill-[#FFB300] text-[#FFB300]"
                      : "fill-gray-200 text-gray-200",
                  )}
                />
              ))}
              <span className="ml-1 text-sm font-bold">
                {avgRating > 0 ? avgRating.toFixed(1) : "-"}
              </span>
              {reviewCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({reviewCount})
                </span>
              )}
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* 두꺼운 구분선 */}
      <div className="my-2 h-2 bg-gray-100" />

      {/* ── 메뉴 탭바 ── */}
      {menuGroups.length > 0 && (
        <>
          <div className="sticky top-0 z-40 border-b border-gray-200 bg-white">
            <div className="flex overflow-x-auto scrollbar-hide">
              {/* 인기 탭 (인기 메뉴가 있을 때만) */}
              {popularMenus.length > 0 && (
                <button
                  onClick={() => setActiveTab("popular")}
                  className={cn(
                    "relative flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors",
                    activeTab === "popular"
                      ? "font-bold text-black"
                      : "font-medium text-gray-400",
                  )}
                >
                  인기
                  {activeTab === "popular" && (
                    <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-black" />
                  )}
                </button>
              )}

              {/* 신메뉴 탭 */}
              {newMenus.length > 0 && (
                <button
                  onClick={() => setActiveTab("new")}
                  className={cn(
                    "relative flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors",
                    activeTab === "new"
                      ? "font-bold text-black"
                      : "font-medium text-gray-400",
                  )}
                >
                  신메뉴
                  {activeTab === "new" && (
                    <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-black" />
                  )}
                </button>
              )}

              {/* 전체 탭 */}
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "relative flex-shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors",
                  activeTab === "all"
                    ? "font-bold text-black"
                    : "font-medium text-gray-400",
                )}
              >
                전체
                {activeTab === "all" && (
                  <span className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-black" />
                )}
              </button>

              {/* 카테고리별 탭 (전체 모드에서만 활성) */}
              {activeTab === "all" &&
                menuGroups.map((group) => (
                  <button
                    key={group.category}
                    onClick={() => {
                      const el = document.getElementById(
                        `menu-category-${group.category}`,
                      )
                      if (el) {
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                      }
                    }}
                    className="relative flex-shrink-0 whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-400"
                  >
                    {group.category}
                  </button>
                ))}
            </div>
          </div>

          {/* ── 메뉴 리스트 ── */}
          <div className="px-4">
            {filteredMenus ? (
              // 인기/신메뉴 필터 모드
              filteredMenus.length > 0 ? (
                <div className="divide-y divide-gray-100 py-2">
                  {filteredMenus.map((item, idx) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      rank={activeTab === "popular" ? idx + 1 : undefined}
                      onAddToCart={handleMenuClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-gray-400">
                  {activeTab === "popular"
                    ? "인기 메뉴가 없습니다"
                    : "신메뉴가 없습니다"}
                </div>
              )
            ) : (
              // 전체: 카테고리별 그룹
              menuGroups.map((group) => (
                <section
                  key={group.category}
                  id={`menu-category-${group.category}`}
                  className="pt-5 pb-2"
                >
                  <h3 className="text-[17px] font-bold text-gray-900 mb-1">
                    {group.category}
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {group.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAddToCart={handleMenuClick}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </>
      )}

      {/* ── 메뉴 옵션 시트 ── */}
      {selectedMenu && (
        <MenuOptionSheet
          menu={selectedMenu}
          open={menuSheetOpen}
          onOpenChange={setMenuSheetOpen}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* ── 다른 가게 장바구니 교체 다이얼로그 ── */}
      <DifferentRestaurantDialog
        open={showDifferentDialog}
        onOpenChange={setShowDifferentDialog}
        onConfirm={handleReplaceCart}
      />

      {/* ── 하단 고정: 장바구니 바 ── */}
      {mounted && cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
          <Link
            href="/cart"
            className="flex items-center justify-between rounded-2xl bg-[#2DB400] px-5 py-3.5 text-white shadow-lg transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart className="size-5" />
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#2DB400]">
                  {cartItemCount}
                </span>
              </div>
              <span className="ml-1 text-sm font-medium">
                장바구니 {cartItemCount}개
              </span>
            </div>
            <span className="text-base font-bold">
              {formatPrice(cartTotalPrice)}
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
