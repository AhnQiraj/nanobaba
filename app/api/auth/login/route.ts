import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import {
  sessionCookieName,
  shouldUseSecureCookie,
  signSessionToken,
} from "@/lib/session";

export async function POST(request: Request) {
  let password = "";

  try {
    const body = await request.json();
    password = typeof body.password === "string" ? body.password : "";
  } catch (error) {
    console.error("[auth.login] invalid request body", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: "登录请求格式不正确" }, { status: 400 });
  }

  let config: ReturnType<typeof loadConfig>;

  try {
    config = loadConfig();
  } catch (error) {
    console.error("[auth.login] config validation failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "服务端配置异常，请查看容器日志" },
      { status: 500 },
    );
  }

  if (password !== config.password) {
    console.warn("[auth.login] invalid password", {
      passwordLength: password.length,
    });

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

  console.info("[auth.login] login succeeded");

  return NextResponse.json({ ok: true });
}
