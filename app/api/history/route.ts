import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth-guard";
import { listRecentHistory } from "@/lib/history-repository";

export async function GET() {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const items = listRecentHistory().map((item) => ({
    ...item,
    imageUrl: `/api/history/${item.id}/image`,
  }));

  return NextResponse.json({ items });
}
