import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { generateImage } from "@/lib/gemini-client";
import { insertHistoryRow } from "@/lib/history-repository";
import { buildImageFilePath, writeImageFile } from "@/lib/image-storage";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
  }

  const config = loadConfig();
  const id = randomUUID();
  const createdAt = new Date();

  try {
    const result = await generateImage(prompt);
    const paths = buildImageFilePath(
      config.imageStorageDir,
      id,
      createdAt,
      result.mimeType,
    );

    writeImageFile(paths.absolutePath, result.buffer);

    insertHistoryRow({
      id,
      prompt,
      model: config.imageModel,
      imagePath: paths.absolutePath,
      mimeType: result.mimeType,
      status: "success",
      errorMessage: null,
      createdAt: createdAt.toISOString(),
    });

    return NextResponse.json({
      id,
      prompt,
      imageUrl: paths.publicPath,
      createdAt: createdAt.toISOString(),
    });
  } catch (error) {
    insertHistoryRow({
      id,
      prompt,
      model: config.imageModel,
      imagePath: "",
      mimeType: "",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "unknown error",
      createdAt: createdAt.toISOString(),
    });

    return NextResponse.json({ error: "生成失败，请稍后再试" }, { status: 502 });
  }
}
