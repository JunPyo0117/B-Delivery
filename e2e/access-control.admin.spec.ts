import { test, expect } from "@playwright/test";

test.describe("Admin 접근 제어 (ADMIN 역할)", () => {
  test("ADMIN 역할은 /admin 접근 가능", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
    await expect(page.getByText("관리자 대시보드")).toBeVisible();
  });
});
