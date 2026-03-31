import { expect, test } from "@playwright/test";

test("renders the main generator layout after login", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("请输入密码").fill("test-password");
  await page.getByRole("button", { name: "登录" }).click();

  await expect(page.getByRole("button", { name: "生成图片" })).toBeVisible();
  await expect(page.getByText("最近历史")).toBeVisible();
});

test("shows generated image in result area and history", async ({ page }) => {
  let historyResponse = { items: [] as Array<{ id: string; prompt: string; createdAt: string }> };

  await page.route("**/api/history", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(historyResponse),
    });
  });

  await page.route("**/api/generate", async (route) => {
    historyResponse = {
      items: [
        {
          id: "entry-1",
          prompt: "一只红苹果，白色背景",
          createdAt: "2026-03-31T12:00:00.000Z",
        },
      ],
    };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "entry-1",
        prompt: "一只红苹果，白色背景",
        imageUrl: "/mock/generated-apple.jpg",
        createdAt: "2026-03-31T12:00:00.000Z",
      }),
    });
  });

  await page.goto("/login");
  await page.getByPlaceholder("请输入密码").fill("test-password");
  await page.getByRole("button", { name: "登录" }).click();
  await page
    .getByPlaceholder("例如：帮我生成一张春天傍晚的花园照片，暖色调，自然光，写实风格")
    .fill("一只红苹果，白色背景");
  await page.getByRole("button", { name: "生成图片" }).click();

  await expect(page.getByRole("img", { name: "最新生成图片" })).toBeVisible();
  await expect(page.getByText("一只红苹果，白色背景").nth(1)).toBeVisible();
  await expect(
    page.getByRole("listitem").getByText("一只红苹果，白色背景"),
  ).toBeVisible();
});

test("shows selected reference image previews before generation", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("请输入密码").fill("test-password");
  await page.getByRole("button", { name: "登录" }).click();

  await page.setInputFiles('input[type="file"]', {
    name: "ref-1.png",
    mimeType: "image/png",
    buffer: Buffer.from("fake-image"),
  });

  await expect(page.getByText("已选参考图")).toBeVisible();
  await expect(page.getByText("ref-1.png")).toBeVisible();
});

test("submits up to 3 reference images with the prompt", async ({ page }) => {
  let sawMultipartRequest = false;

  await page.route("**/api/generate", async (route) => {
    const request = route.request();
    const contentType = await request.headerValue("content-type");
    const requestBody = request.postDataBuffer()?.toString("utf8") ?? "";

    sawMultipartRequest =
      request.method() === "POST" &&
      contentType?.includes("multipart/form-data") === true &&
      requestBody.includes('name="prompt"') &&
      requestBody.includes("三只猫坐在窗边，写实风格") &&
      requestBody.includes('name="referenceImages"') &&
      requestBody.includes("1.png") &&
      requestBody.includes("2.png") &&
      requestBody.includes("3.png");

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "entry-3-images",
        prompt: "三只猫坐在窗边，写实风格",
        imageUrl: "/mock/generated-cats.jpg",
        createdAt: "2026-03-31T12:05:00.000Z",
      }),
    });
  });

  await page.goto("/login");
  await page.getByPlaceholder("请输入密码").fill("test-password");
  await page.getByRole("button", { name: "登录" }).click();
  await page
    .getByPlaceholder("例如：帮我生成一张春天傍晚的花园照片，暖色调，自然光，写实风格")
    .fill("三只猫坐在窗边，写实风格");

  await page.setInputFiles('input[type="file"]', [
    { name: "1.png", mimeType: "image/png", buffer: Buffer.from("1") },
    { name: "2.png", mimeType: "image/png", buffer: Buffer.from("2") },
    { name: "3.png", mimeType: "image/png", buffer: Buffer.from("3") },
  ]);

  await page.getByRole("button", { name: "生成图片" }).click();

  await expect.poll(() => sawMultipartRequest).toBe(true);
});

test("blocks selecting more than 3 reference images", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("请输入密码").fill("test-password");
  await page.getByRole("button", { name: "登录" }).click();

  await page.setInputFiles('input[type="file"]', [
    { name: "1.png", mimeType: "image/png", buffer: Buffer.from("1") },
    { name: "2.png", mimeType: "image/png", buffer: Buffer.from("2") },
    { name: "3.png", mimeType: "image/png", buffer: Buffer.from("3") },
    { name: "4.png", mimeType: "image/png", buffer: Buffer.from("4") },
  ]);

  await expect(page.getByText("最多上传 3 张参考图")).toBeVisible();
});
