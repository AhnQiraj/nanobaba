import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import {
  sessionCookieName,
  shouldUseSecureCookie,
  signSessionToken,
} from "@/lib/session";

export async function POST(request: Request) {
  const { password } = await request.json();
  const config = loadConfig();

  if (password !== config.password) {
    return NextResponse.json({ error: "密码不正确" }, { status: 401 });
  }

  const token = await signSessionToken(config.sessionSecret);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request.headers),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}
