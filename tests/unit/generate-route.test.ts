import { beforeAll, describe, expect, it } from "vitest";

describe("generate route config", () => {
  beforeAll(() => {
    process.env.APP_PASSWORD = "secret";
    process.env.SESSION_SECRET = "12345678901234567890123456789012";
    process.env.OPENAI_IMAGE_BASE_URL = "https://example.invalid";
    process.env.OPENAI_IMAGE_API_KEY = "test-key";
    process.env.OPENAI_IMAGE_MODEL = "gpt-image-2";
    process.env.DATABASE_URL = "file:/tmp/nanobaba-route-test.db";
    process.env.IMAGE_STORAGE_DIR = "/tmp/nanobaba-route-test-images";
  });

  it("allows long-running image edit requests", async () => {
    const { maxDuration } = await import("@/app/api/generate/route");

    expect(maxDuration).toBe(120);
  });
});
