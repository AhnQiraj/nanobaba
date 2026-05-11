import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGenerationRequestBody,
  describeGenerationError,
  fileToReferenceImageInput,
  generateImage,
  parseGeneratedImage,
} from "@/lib/gpt-image-client";

describe("buildGenerationRequestBody", () => {
  it("builds the OpenAI-compatible text generation body", () => {
    expect(buildGenerationRequestBody("一只红苹果", "gpt-image-2")).toEqual({
      model: "gpt-image-2",
      prompt: "一只红苹果",
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });
  });
});

describe("parseGeneratedImage", () => {
  it("extracts bytes from OpenAI-compatible b64_json data", () => {
    const result = parseGeneratedImage({
      data: [{ b64_json: "aGVsbG8=" }],
      output_format: "png",
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.buffer.toString("utf8")).toBe("hello");
  });

  it("throws when no generated image is present", () => {
    expect(() => parseGeneratedImage({ data: [] })).toThrow(
      "image not found in GPT image response",
    );
  });
});

describe("describeGenerationError", () => {
  it("includes the lower-level fetch failure cause", () => {
    const error = new TypeError("fetch failed", {
      cause: new Error("other side closed"),
    });

    expect(describeGenerationError(error)).toBe(
      "fetch failed: other side closed",
    );
  });
});

describe("generateImage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("posts JSON to generations when no reference image is provided", async () => {
    vi.stubEnv("APP_PASSWORD", "secret");
    vi.stubEnv("SESSION_SECRET", "12345678901234567890123456789012");
    vi.stubEnv("OPENAI_IMAGE_BASE_URL", "https://app.yylx.io");
    vi.stubEnv("OPENAI_IMAGE_API_KEY", "test-key");
    vi.stubEnv("OPENAI_IMAGE_MODEL", "gpt-image-2");
    vi.stubEnv("DATABASE_URL", "file:/tmp/nanobaba.db");
    vi.stubEnv("IMAGE_STORAGE_DIR", "/tmp/nanobaba-images");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ b64_json: "aGVsbG8=" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await generateImage("一只红苹果");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.yylx.io/v1/images/generations",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-key",
        },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: "一只红苹果",
          n: 1,
          size: "1024x1024",
          response_format: "b64_json",
        }),
      }),
    );
  });

  it("falls back to edits with a blank image when text generation disconnects", async () => {
    vi.stubEnv("APP_PASSWORD", "secret");
    vi.stubEnv("SESSION_SECRET", "12345678901234567890123456789012");
    vi.stubEnv("OPENAI_IMAGE_BASE_URL", "https://app.yylx.io");
    vi.stubEnv("OPENAI_IMAGE_API_KEY", "test-key");
    vi.stubEnv("OPENAI_IMAGE_MODEL", "gpt-image-2");
    vi.stubEnv("DATABASE_URL", "file:/tmp/nanobaba.db");
    vi.stubEnv("IMAGE_STORAGE_DIR", "/tmp/nanobaba-images");

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ b64_json: "aGVsbG8=" }] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await generateImage("一只红苹果");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://app.yylx.io/v1/images/edits",
    );
    expect(fetchMock.mock.calls[1][1].body).toBeInstanceOf(FormData);
  });

  it("posts multipart form data to edits when reference images are provided", async () => {
    vi.stubEnv("APP_PASSWORD", "secret");
    vi.stubEnv("SESSION_SECRET", "12345678901234567890123456789012");
    vi.stubEnv("OPENAI_IMAGE_BASE_URL", "https://app.yylx.io/");
    vi.stubEnv("OPENAI_IMAGE_API_KEY", "test-key");
    vi.stubEnv("OPENAI_IMAGE_MODEL", "gpt-image-2");
    vi.stubEnv("DATABASE_URL", "file:/tmp/nanobaba.db");
    vi.stubEnv("IMAGE_STORAGE_DIR", "/tmp/nanobaba-images");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ b64_json: "d29ybGQ=" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const image = await fileToReferenceImageInput(
      new File([new Uint8Array([1, 2, 3])], "sample.png", {
        type: "image/png",
      }),
    );

    await generateImage("换成水彩风格", [image]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.yylx.io/v1/images/edits");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: "Bearer test-key" });
    expect(init.body).toBeInstanceOf(FormData);

    const formData = init.body as FormData;
    expect(formData.get("model")).toBe("gpt-image-2");
    expect(formData.get("prompt")).toBe("换成水彩风格");
    expect(formData.get("n")).toBe("1");
    expect(formData.get("size")).toBe("1024x1024");
    expect(formData.get("response_format")).toBe("b64_json");
    expect(formData.getAll("image[]")).toHaveLength(1);
  });
});
