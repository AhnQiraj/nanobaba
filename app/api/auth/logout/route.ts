import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
