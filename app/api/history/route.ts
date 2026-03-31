import { NextResponse } from "next/server";
import { listRecentHistory } from "@/lib/history-repository";

export async function GET() {
  const items = listRecentHistory();
  return NextResponse.json({ items });
}
