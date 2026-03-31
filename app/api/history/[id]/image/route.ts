import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth-guard";
import { findHistoryById } from "@/lib/history-repository";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticatedRequest())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const row = findHistoryById(id);

  if (!row?.imagePath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const buffer = await readFile(row.imagePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": row.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
