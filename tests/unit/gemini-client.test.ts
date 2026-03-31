import { describe, expect, it } from "vitest";
import { buildGenerateParts, parseGeneratedImage } from "@/lib/gemini-client";

describe("buildGenerateParts", () => {
  it("builds text and multiple inline_data parts", () => {
    const parts = buildGenerateParts("一只红苹果", [
      { mimeType: "image/png", data: "YWJj" },
      { mimeType: "image/jpeg", data: "ZGVm" },
    ]);

    expect(parts).toEqual([
      { text: "一只红苹果" },
      { inline_data: { mime_type: "image/png", data: "YWJj" } },
      { inline_data: { mime_type: "image/jpeg", data: "ZGVm" } },
    ]);
  });
});

describe("parseGeneratedImage", () => {
  it("extracts mime type and bytes from Gemini inlineData", () => {
    const result = parseGeneratedImage({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: "aGVsbG8=",
                },
              },
            ],
          },
        },
      ],
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.buffer.toString("utf8")).toBe("hello");
  });

  it("extracts mime type and bytes from Gemini inline_data", () => {
    const result = parseGeneratedImage({
      candidates: [
        {
          content: {
            parts: [
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: "d29ybGQ=",
                },
              },
            ],
          },
        },
      ],
    });

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.buffer.toString("utf8")).toBe("world");
  });
});
