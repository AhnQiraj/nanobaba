import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "nanobaba_session";

function secretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(secret: string) {
  return new SignJWT({ loggedIn: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey(secret));
}

export async function verifySessionToken(token: string, secret: string) {
  const result = await jwtVerify(token, secretKey(secret));
  return result.payload as { loggedIn: boolean };
}

export function shouldUseSecureCookie(headers: Headers) {
  const forwardedProto = headers.get("x-forwarded-proto");

  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }

  const origin = headers.get("origin");

  if (origin) {
    return origin.startsWith("https://");
  }

  return false;
}

export const sessionCookieName = COOKIE_NAME;
