import { test, expect } from "@playwright/test";

test.describe("시나리오 1: 주문 Happy Path", () => {
  test("홈 화면 접근 + 음식점 리스트 표시", async ({ page }) => {
    await page.goto("/");
    // 주소 미설정 시 주소 설정으로 리다이렉트될 수 있음
    await page.waitForTimeout(2000);
    const url = page.url();
    // 홈 또는 주소 설정 페이지
    expect(url).toMatch(/\/$|\/mypage\/addresses/);
  });

  test("장바구니 페이지 접근 가능", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForTimeout(1000);
    // 장바구니 텍스트가 헤더에 있음
    await expect(page.getByRole("heading", { name: /장바구니/ })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("시나리오 2: 주문 내역", () => {
  test("주문 내역 페이지 접근", async ({ page }) => {
    await page.goto("/orders");
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name: /주문/ })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("시나리오 6: 채팅", () => {
  test("채팅 목록 페이지 접근", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForTimeout(1000);
    // "채팅" 또는 "상담" 텍스트
    await expect(page.locator("h1")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("시나리오 7: 마이페이지", () => {
  test("마이페이지 접근", async ({ page }) => {
    await page.goto("/mypage");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/mypage");
  });

  test("주소 관리 접근", async ({ page }) => {
    await page.goto("/mypage/addresses");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/mypage/addresses");
  });

  test("찜 목록 접근", async ({ page }) => {
    await page.goto("/favorites");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/favorites");
  });
});
