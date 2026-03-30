import { test, expect } from "@playwright/test";

test.describe("접근 제어 (USER 역할)", () => {
  test("USER 역할은 /admin 접근 시 /로 리다이렉트", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL("/");
  });

  test("USER 역할은 /owner 접근 시 /로 리다이렉트", async ({ page }) => {
    await page.goto("/owner");
    await expect(page).toHaveURL("/");
  });
});
