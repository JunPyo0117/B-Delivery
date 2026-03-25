import { test, expect } from "@playwright/test";

test.describe("홈페이지", () => {
  test("홈페이지 접근 가능", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test("로그인된 사용자는 홈페이지에서 비디릴버리 텍스트 확인", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText("비디릴버리");
  });
});
