import { describe, expect, it } from "vitest";
import { loadConfig } from "@/lib/config";

describe("loadConfig", () => {
  it("reads all required env vars", () => {
    const config = loadConfig({
      APP_PASSWORD: "secret",
      SESSION_SECRET: "12345678901234567890123456789012",
      OPENAI_IMAGE_BASE_URL: "https://app.yylx.io",
      OPENAI_IMAGE_API_KEY: "test-key",
      OPENAI_IMAGE_MODEL: "gpt-image-2",
      DATABASE_URL: "file:/tmp/nanobaba.db",
      IMAGE_STORAGE_DIR: "/tmp/nanobaba-images",
    });

    expect(config.proxyBaseUrl).toBe("https://app.yylx.io");
    expect(config.imageModel).toBe("gpt-image-2");
  });

  it("keeps compatibility with legacy Gemini env var names", () => {
    const config = loadConfig({
      APP_PASSWORD: "secret",
      SESSION_SECRET: "12345678901234567890123456789012",
      GEMINI_PROXY_BASE_URL: "https://mytoken.online/",
      GEMINI_PROXY_API_KEY: "test-key",
      GEMINI_IMAGE_MODEL: "gemini-3.1-flash-image",
      DATABASE_URL: "file:/tmp/nanobaba.db",
      IMAGE_STORAGE_DIR: "/tmp/nanobaba-images",
    });

    expect(config.proxyBaseUrl).toBe("https://mytoken.online");
    expect(config.imageModel).toBe("gemini-3.1-flash-image");
  });
});
