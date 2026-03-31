import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/session";

describe("session token", () => {
  it("round-trips a logged-in marker", async () => {
    const token = await signSessionToken(
      "12345678901234567890123456789012",
    );
    const payload = await verifySessionToken(
      token,
      "12345678901234567890123456789012",
    );

    expect(payload.loggedIn).toBe(true);
  });
});
