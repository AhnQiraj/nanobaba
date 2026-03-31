import { describe, expect, it } from "vitest";
import {
  shouldUseSecureCookie,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session";

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

  it("uses secure cookies for https requests", () => {
    const headers = new Headers({
      "x-forwarded-proto": "https",
    });

    expect(shouldUseSecureCookie(headers)).toBe(true);
  });

  it("does not use secure cookies for plain http requests", () => {
    const headers = new Headers({
      "x-forwarded-proto": "http",
    });

    expect(shouldUseSecureCookie(headers)).toBe(false);
  });
});
