import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    env: {
      APP_PASSWORD: "test-password",
      SESSION_SECRET: "12345678901234567890123456789012",
      GEMINI_PROXY_BASE_URL: "https://example.invalid",
      GEMINI_PROXY_API_KEY: "test-key",
      GEMINI_IMAGE_MODEL: "gemini-3.1-flash-image",
      DATABASE_URL: "file:./data/e2e.db",
      IMAGE_STORAGE_DIR: "./data/e2e-images",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    port: 3100,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
