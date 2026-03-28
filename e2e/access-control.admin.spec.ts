import { test, expect } from "@playwright/test";

test.describe("Admin 접근 제어 (ADMIN 역할)", () => {
  test("ADMIN 역할은 /admin 접근 가능", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await page.waitForTimeout(2000);
    // admin 페이지에 머무름 (리다이렉트 안 됨)
    expect(page.url()).toContain("/admin");
  });
});
