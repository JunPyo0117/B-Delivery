import { test, expect } from "@playwright/test";

test.describe("홈페이지", () => {
  test("홈페이지 접근 가능 (홈 또는 주소 설정)", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    const url = page.url();
    // 주소 미설정 시 주소 설정으로 리다이렉트, 아니면 홈
    expect(url).toMatch(/\/$|\/mypage\/addresses/);
  });
});
