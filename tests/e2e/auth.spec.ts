import { expect, test } from "@playwright/test";

test("shows login form when logged out", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
});

test("blocks history api when logged out", async ({ request }) => {
  const response = await request.get("/api/history");

  expect(response.status()).toBe(401);
});
