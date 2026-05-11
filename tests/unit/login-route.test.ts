import { afterEach, describe, expect, it, vi } from "vitest";

describe("login route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns a configuration error and logs details when config is invalid", async () => {
    vi.stubEnv("APP_PASSWORD", "abc");
    vi.stubEnv("SESSION_SECRET", "too-short");
    vi.stubEnv("OPENAI_IMAGE_BASE_URL", "https://example.invalid");
    vi.stubEnv("OPENAI_IMAGE_API_KEY", "test-key");
    vi.stubEnv("OPENAI_IMAGE_MODEL", "gpt-image-2");
    vi.stubEnv("DATABASE_URL", "file:/tmp/nanobaba-login-test.db");
    vi.stubEnv("IMAGE_STORAGE_DIR", "/tmp/nanobaba-login-test-images");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { POST } = await import("@/app/api/auth/login/route");

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "abc" }),
      }),
    );

    await expect(response.json()).resolves.toEqual({
      error: "服务端配置异常，请查看容器日志",
    });
    expect(response.status).toBe(500);
    expect(errorSpy).toHaveBeenCalledWith(
      "[auth.login] config validation failed",
      expect.objectContaining({
        error: expect.any(String),
      }),
    );
  });
});
