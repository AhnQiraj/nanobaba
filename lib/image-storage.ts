import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  return "jpg";
}

export function buildImageFilePath(
  rootDir: string,
  id: string,
  createdAt: Date,
  mimeType: string,
) {
  const year = String(createdAt.getUTCFullYear());
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
  const extension = extensionForMimeType(mimeType);
  const directory = join(rootDir, year, month);

  return {
    directory,
    absolutePath: join(directory, `${id}.${extension}`),
    publicPath: `/api/history/${id}/image`,
  };
}

export function writeImageFile(absolutePath: string, buffer: Buffer) {
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, buffer);
}
