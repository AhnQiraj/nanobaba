import { describe, expect, it } from "vitest";
import { validateReferenceImages } from "@/lib/gemini-client";

function createFile(size: number, type: string, name = "sample.png") {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateReferenceImages", () => {
  it("accepts up to 3 jpg/png/webp images", () => {
    const result = validateReferenceImages([
      createFile(128, "image/png"),
      createFile(256, "image/jpeg", "sample.jpg"),
      createFile(512, "image/webp", "sample.webp"),
    ]);

    expect(result).toHaveLength(3);
  });

  it("rejects more than 3 images", () => {
    expect(() =>
      validateReferenceImages([
        createFile(1, "image/png", "1.png"),
        createFile(1, "image/png", "2.png"),
        createFile(1, "image/png", "3.png"),
        createFile(1, "image/png", "4.png"),
      ]),
    ).toThrow("最多上传 3 张参考图");
  });

  it("rejects unsupported file types", () => {
    expect(() =>
      validateReferenceImages([createFile(1, "image/gif", "sample.gif")]),
    ).toThrow("仅支持 JPG、PNG、WebP");
  });

  it("rejects files larger than 10MB", () => {
    expect(() =>
      validateReferenceImages([
        createFile(10 * 1024 * 1024 + 1, "image/png", "too-large.png"),
      ]),
    ).toThrow("单张图片不能超过 10MB");
  });
});
