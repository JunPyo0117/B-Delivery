import { test, expect } from "@playwright/test";

test.describe("관리자 대시보드", () => {
  test("대시보드 접근", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/admin");
  });

  test("사이드바 네비게이션 링크 존재", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForTimeout(3000);
    // 사이드바 내 링크 확인 (href 기반)
    await expect(page.locator('a[href="/admin/users"]')).toBeAttached({ timeout: 5000 });
  });
});

test.describe("관리자 사용자 관리", () => {
  test("사용자 리스트 페이지 접근", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/admin/users");
  });
});

test.describe("관리자 신고 관리", () => {
  test("신고 리스트 페이지 접근", async ({ page }) => {
    await page.goto("/admin/reports");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/admin/reports");
  });
});

test.describe("관리자 배달기사 관리", () => {
  test("기사 리스트 페이지 접근", async ({ page }) => {
    await page.goto("/admin/riders");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/admin/riders");
  });
});

test.describe("관리자 배달 현황", () => {
  test("모니터링 페이지 접근", async ({ page }) => {
    await page.goto("/admin/monitoring");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/admin/monitoring");
  });
});

test.describe("관리자 고객센터", () => {
  test("CS 3패널 페이지 접근", async ({ page }) => {
    await page.goto("/admin/cs");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/admin/cs");
  });
});

test.describe("삭제된 페이지", () => {
  test("delivery-radius 404", async ({ page }) => {
    const response = await page.goto("/admin/delivery-radius");
    expect(response?.status()).toBe(404);
  });
});
