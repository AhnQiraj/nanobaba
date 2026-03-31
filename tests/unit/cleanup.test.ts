import { describe, expect, it } from "vitest";
import { buildCleanupPlan } from "@/lib/cleanup";

describe("buildCleanupPlan", () => {
  it("marks records older than 30 days for deletion", () => {
    const now = new Date("2026-03-31T12:00:00.000Z");
    const plan = buildCleanupPlan(
      [
        {
          id: "old",
          imagePath: "data/images/2026/02/old.jpg",
          createdAt: "2026-02-01T00:00:00.000Z",
        },
        {
          id: "new",
          imagePath: "data/images/2026/03/new.jpg",
          createdAt: "2026-03-25T00:00:00.000Z",
        },
      ],
      now,
    );

    expect(plan.deleteIds).toEqual(["old"]);
    expect(plan.deleteFiles).toEqual(["data/images/2026/02/old.jpg"]);
  });
});
