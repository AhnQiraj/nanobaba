import { expect, test } from "@playwright/test";

test("renders the main generator layout after login", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("请输入密码").fill("test-password");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("button", { name: "生成图片" })).toBeVisible();
  await expect(page.getByText("最近历史")).toBeVisible();
});
