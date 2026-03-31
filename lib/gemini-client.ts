import { loadConfig } from "@/lib/config";

type ProxyResponse = {
  choices?: Array<{
    message?: {
      images?: Array<{
        image_url?: {
          url?: string;
        };
      }>;
    };
  }>;
};

export function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("invalid image data url");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

export async function generateImage(prompt: string) {
  const config = loadConfig();
  const response = await fetch(`${config.proxyBaseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.proxyApiKey}`,
    },
    body: JSON.stringify({
      model: config.imageModel,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`proxy request failed: ${response.status}`);
  }

  const json = (await response.json()) as ProxyResponse;
  const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;

  if (!dataUrl) {
    throw new Error("image not found in response");
  }

  return parseImageDataUrl(dataUrl);
}
