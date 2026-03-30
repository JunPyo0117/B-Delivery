import { test, expect } from "@playwright/test";

test.describe("배달기사 기능", () => {
  test("배달 대기 페이지 접근", async ({ page }) => {
    await page.goto("/rider");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/rider");
  });

  test("배달 내역 페이지 접근", async ({ page }) => {
    await page.goto("/rider/history");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/rider/history");
  });

  test("수익 요약 페이지 접근", async ({ page }) => {
    await page.goto("/rider/earnings");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/rider/earnings");
  });

  test("마이페이지 접근", async ({ page }) => {
    await page.goto("/rider/mypage");
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/rider/mypage");
  });
});
