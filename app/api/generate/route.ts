import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth-guard";
import { loadConfig } from "@/lib/config";
import {
  fileToInlineImageInput,
  generateImage,
  validateReferenceImages,
} from "@/lib/gemini-client";
import { insertHistoryRow } from "@/lib/history-repository";
import { buildImageFilePath, writeImageFile } from "@/lib/image-storage";

export async function POST(request: Request) {
  if (!(await isAuthenticatedRequest())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const formData = await request.formData();
  const prompt = formData.get("prompt");
  const rawFiles = formData.getAll("referenceImages");

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
  }

  const files = rawFiles.filter((value): value is File => value instanceof File);

  let referenceImages;
  try {
    referenceImages = await Promise.all(
      validateReferenceImages(files).map((file) => fileToInlineImageInput(file)),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "参考图校验失败" },
      { status: 400 },
    );
  }

  const config = loadConfig();
  const id = randomUUID();
  const createdAt = new Date();

  try {
    const result = await generateImage(prompt, referenceImages);
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
