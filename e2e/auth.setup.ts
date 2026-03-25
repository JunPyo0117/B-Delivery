import { test as setup } from "@playwright/test";

async function authenticate(
  page: import("@playwright/test").Page,
  email: string,
  storageStatePath: string
) {
  // CSRF 토큰 획득
  await page.goto("/api/auth/csrf");
  const csrfText = await page.locator("body").innerText();
  const { csrfToken } = JSON.parse(csrfText);

  // test-credentials provider로 직접 POST 요청
  const res = await page.request.post("/api/auth/callback/test-credentials", {
    form: {
      csrfToken,
      email,
    },
  });

  // 리다이렉트 후 쿠키가 설정되므로 홈으로 이동하여 확인
  await page.goto("/");
  await page.context().storageState({ path: storageStatePath });
}

setup("authenticate as user", async ({ page }) => {
  await authenticate(page, "user@bdelivery.com", "e2e/.auth/user.json");
});

setup("authenticate as admin", async ({ page }) => {
  await authenticate(page, "admin@bdelivery.com", "e2e/.auth/admin.json");
});

setup("authenticate as owner", async ({ page }) => {
  await authenticate(page, "owner@bdelivery.com", "e2e/.auth/owner.json");
});
