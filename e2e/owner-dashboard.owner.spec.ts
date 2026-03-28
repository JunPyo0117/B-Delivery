import { test, expect } from "@playwright/test";

test.describe("사장 대시보드 (PC)", () => {
  test("대시보드 접근", async ({ page }) => {
    await page.goto("/owner/dashboard");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/owner/dashboard");
  });

  test("주문 관리 페이지 접근", async ({ page }) => {
    await page.goto("/owner/orders");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/owner/orders");
  });

  test("메뉴 관리 + 메뉴 가져오기 버튼", async ({ page }) => {
    await page.goto("/owner/menus");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/owner/menus");
    await expect(page.locator("text=메뉴 가져오기")).toBeVisible({ timeout: 5000 });
  });

  test("메뉴 가져오기 다이얼로그 열기", async ({ page }) => {
    await page.goto("/owner/menus");
    await page.waitForTimeout(2000);
    await page.click("text=메뉴 가져오기");
    await expect(page.locator("text=카테고리 템플릿")).toBeVisible({ timeout: 3000 });
  });

  test("리뷰 관리 페이지 접근", async ({ page }) => {
    await page.goto("/owner/reviews");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/owner/reviews");
  });

  test("매출 통계 페이지 접근", async ({ page }) => {
    await page.goto("/owner/stats");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/owner/stats");
  });

  test("가게 설정 페이지 접근", async ({ page }) => {
    await page.goto("/owner/settings");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/owner/settings");
  });

  test("채팅 페이지 접근", async ({ page }) => {
    await page.goto("/owner/chat");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/owner/chat");
  });
});
