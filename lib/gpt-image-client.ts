import { loadConfig } from "@/lib/config";

export type ReferenceImageInput = {
  file: File;
};

const MAX_REFERENCE_IMAGES = 3;
const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_REFERENCE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type GptImageResponse = {
  data?: Array<{
    b64_json?: string;
  }>;
  output_format?: string;
};

const BLANK_REFERENCE_IMAGE = new File(
  [
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64",
    ),
  ],
  "blank.png",
  { type: "image/png" },
);

export function validateReferenceImages(files: File[]) {
  if (files.length > MAX_REFERENCE_IMAGES) {
    throw new Error("最多上传 3 张参考图");
  }

  for (const file of files) {
    if (!ALLOWED_REFERENCE_IMAGE_TYPES.has(file.type)) {
      throw new Error("仅支持 JPG、PNG、WebP");
    }

    if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
      throw new Error("单张图片不能超过 10MB");
    }
  }

  return files;
}

export async function fileToReferenceImageInput(
  file: File,
): Promise<ReferenceImageInput> {
  return { file };
}

export function buildGenerationRequestBody(prompt: string, model: string) {
  return {
    model,
    prompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json",
  };
}

function mimeTypeFromOutputFormat(outputFormat: string | undefined) {
  if (outputFormat === "jpeg" || outputFormat === "jpg") {
    return "image/jpeg";
  }

  if (outputFormat === "webp") {
    return "image/webp";
  }

  return "image/png";
}

export function parseGeneratedImage(json: GptImageResponse) {
  const data = json.data?.[0]?.b64_json;

  if (!data) {
    throw new Error("image not found in GPT image response");
  }

  return {
    mimeType: mimeTypeFromOutputFormat(json.output_format),
    buffer: Buffer.from(data, "base64"),
  };
}

function buildEditRequestBody(
  prompt: string,
  model: string,
  referenceImages: ReferenceImageInput[],
) {
  const formData = new FormData();

  formData.append("model", model);
  formData.append("prompt", prompt);
  formData.append("n", "1");
  formData.append("size", "1024x1024");
  formData.append("response_format", "b64_json");

  for (const image of referenceImages) {
    formData.append("image[]", image.file, image.file.name);
  }

  return formData;
}

export async function generateImage(
  prompt: string,
  referenceImages: ReferenceImageInput[] = [],
) {
  const config = loadConfig();
  const hasReferenceImages = referenceImages.length > 0;

  let response;
  try {
    response = await requestGeneratedImage(prompt, config, referenceImages);
  } catch (error) {
    if (hasReferenceImages) {
      throw error;
    }

    response = await requestGeneratedImage(prompt, config, [
      { file: BLANK_REFERENCE_IMAGE },
    ]);
  }

  if (!response.ok) {
    throw new Error(`proxy request failed: ${response.status}`);
  }

  return parseGeneratedImage((await response.json()) as GptImageResponse);
}

export function describeGenerationError(error: unknown) {
  if (!(error instanceof Error)) {
    return "unknown error";
  }

  const cause = error.cause;
  if (cause instanceof Error) {
    return `${error.message}: ${cause.message}`;
  }

  return error.message;
}

async function requestGeneratedImage(
  prompt: string,
  config: ReturnType<typeof loadConfig>,
  referenceImages: ReferenceImageInput[],
) {
  const hasReferenceImages = referenceImages.length > 0;
  const endpoint = hasReferenceImages ? "edits" : "generations";
  const body = hasReferenceImages
    ? buildEditRequestBody(prompt, config.imageModel, referenceImages)
    : JSON.stringify(buildGenerationRequestBody(prompt, config.imageModel));

  return fetch(`${config.proxyBaseUrl}/v1/images/${endpoint}`, {
    method: "POST",
    headers: hasReferenceImages
      ? {
          Authorization: `Bearer ${config.proxyApiKey}`,
        }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.proxyApiKey}`,
        },
    body,
  });
}
