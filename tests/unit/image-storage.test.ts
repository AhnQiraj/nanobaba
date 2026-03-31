import { describe, expect, it } from "vitest";
import { buildImageFilePath } from "@/lib/image-storage";

describe("buildImageFilePath", () => {
  it("places images under year and month folders", () => {
    const result = buildImageFilePath(
      "/tmp/images",
      "entry-1",
      new Date("2026-03-31T12:00:00.000Z"),
      "image/jpeg",
    );

    expect(result.absolutePath).toContain("/tmp/images/2026/03/entry-1.jpg");
    expect(result.publicPath).toBe("/api/history/entry-1/image");
  });
});
