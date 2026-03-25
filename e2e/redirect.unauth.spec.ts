import { test, expect } from "@playwright/test";

test.describe("미인증 리다이렉트", () => {
  test("미인증 사용자 /admin 접근 시 /login으로 리다이렉트", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("미인증 사용자 /owner 접근 시 /login으로 리다이렉트", async ({
    page,
  }) => {
    await page.goto("/owner");
    await expect(page).toHaveURL(/\/login/);
  });
});
