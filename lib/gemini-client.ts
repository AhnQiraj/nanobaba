import { loadConfig } from "@/lib/config";

export type InlineImageInput = {
  mimeType: string;
  data: string;
};

type GeneratePart =
  | { text: string }
  | {
      inline_data: {
        mime_type: string;
        data: string;
      };
    };

type GeminiImageResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
        inline_data?: {
          mime_type?: string;
          data?: string;
        };
      }>;
    };
  }>;
};

export function buildGenerateParts(
  prompt: string,
  referenceImages: InlineImageInput[],
): GeneratePart[] {
  return [
    { text: prompt },
    ...referenceImages.map((image) => ({
      inline_data: {
        mime_type: image.mimeType,
        data: image.data,
      },
    })),
  ];
}

export function parseGeneratedImage(json: GeminiImageResponse) {
  const parts = json.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    const inlineData = part.inlineData ?? {
      mimeType: part.inline_data?.mime_type,
      data: part.inline_data?.data,
    };

    if (inlineData.mimeType && inlineData.data) {
      return {
        mimeType: inlineData.mimeType,
        buffer: Buffer.from(inlineData.data, "base64"),
      };
    }
  }

  throw new Error("image not found in Gemini response");
}

export async function generateImage(
  prompt: string,
  referenceImages: InlineImageInput[] = [],
) {
  const config = loadConfig();
  const response = await fetch(
    `${config.proxyBaseUrl}/v1beta/models/${config.imageModel}:generateContent?key=${config.proxyApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: buildGenerateParts(prompt, referenceImages),
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`proxy request failed: ${response.status}`);
  }

  return parseGeneratedImage((await response.json()) as GeminiImageResponse);
}
