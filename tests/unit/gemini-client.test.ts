import { describe, expect, it } from "vitest";
import { parseImageDataUrl } from "@/lib/gemini-client";

describe("parseImageDataUrl", () => {
  it("extracts mime type and bytes from a data url", () => {
    const result = parseImageDataUrl("data:image/jpeg;base64,aGVsbG8=");

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.buffer.toString("utf8")).toBe("hello");
  });
});
