# Multi-Image Gemini Native Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add up to 3 reference-image uploads to the generator flow and switch backend image generation from OpenAI-compatible chat completions to Gemini native `generateContent`.

**Architecture:** Keep the existing App Router UI and route structure, but move generation to a `multipart/form-data` upload flow. The route handler validates prompt and files, delegates Gemini-native request construction/parsing to focused helpers in `lib/gemini-client.ts`, then stores only the generated image and history row as before.

**Tech Stack:** Next.js 16 App Router, TypeScript, Gemini native `generateContent`, Vitest, Playwright, Tailwind CSS

---

## File Structure

- Modify: `/root/nanobaba/lib/gemini-client.ts`
  Purpose: Replace OpenAI-compatible request logic with Gemini native helpers for `inline_data`, request construction, and image parsing.
- Modify: `/root/nanobaba/app/api/generate/route.ts`
  Purpose: Accept `multipart/form-data`, validate prompt and uploaded files, and call the new Gemini native helper.
- Modify: `/root/nanobaba/components/prompt-composer.tsx`
  Purpose: Add reference-image selection, preview, removal, client-side validation, and `FormData` submission.
- Modify: `/root/nanobaba/tests/unit/gemini-client.test.ts`
  Purpose: Cover Gemini native helper behavior and image parsing.
- Create: `/root/nanobaba/tests/unit/generate-upload.test.ts`
  Purpose: Cover file validation rules independently of the route.
- Modify: `/root/nanobaba/tests/e2e/generate.spec.ts`
  Purpose: Verify upload UI, 3-image happy path, and over-limit validation.
- Modify: `/root/nanobaba/next.config.ts`
  Purpose: Keep remote development access working with `allowedDevOrigins`.

### Task 1: Add Gemini native helper coverage and implementation

**Files:**
- Modify: `/root/nanobaba/tests/unit/gemini-client.test.ts`
- Modify: `/root/nanobaba/lib/gemini-client.ts`

- [ ] **Step 1: Write the failing Gemini native helper tests**

```ts
// /root/nanobaba/tests/unit/gemini-client.test.ts
import { describe, expect, it } from "vitest";
import {
  buildGenerateParts,
  parseGeneratedImage,
} from "@/lib/gemini-client";

describe("buildGenerateParts", () => {
  it("builds text and multiple inline_data parts", () => {
    const parts = buildGenerateParts("一只红苹果", [
      {
        mimeType: "image/png",
        data: "YWJj",
      },
      {
        mimeType: "image/jpeg",
        data: "ZGVm",
      },
    ]);

    expect(parts).toEqual([
      { text: "一只红苹果" },
      {
        inline_data: {
          mime_type: "image/png",
          data: "YWJj",
        },
      },
      {
        inline_data: {
          mime_type: "image/jpeg",
          data: "ZGVm",
        },
      },
    ]);
  });
});

describe("parseGeneratedImage", () => {
  it("extracts mime type and bytes from Gemini inlineData", () => {
    const result = parseGeneratedImage({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: "aGVsbG8=",
                },
              },
            ],
          },
        },
      ],
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.buffer.toString("utf8")).toBe("hello");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/gemini-client.test.ts`
Expected: FAIL with missing exports `buildGenerateParts` and `parseGeneratedImage`

- [ ] **Step 3: Implement Gemini native request helpers**

```ts
// /root/nanobaba/lib/gemini-client.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/gemini-client.test.ts`
Expected: PASS with `2 passed`

- [ ] **Step 5: Commit**

```bash
git add tests/unit/gemini-client.test.ts lib/gemini-client.ts
git commit -m "feat: switch gemini client to native generateContent"
```

### Task 2: Add upload validation coverage and route support

**Files:**
- Create: `/root/nanobaba/tests/unit/generate-upload.test.ts`
- Modify: `/root/nanobaba/lib/gemini-client.ts`
- Modify: `/root/nanobaba/app/api/generate/route.ts`

- [ ] **Step 1: Write the failing upload validation tests**

```ts
// /root/nanobaba/tests/unit/generate-upload.test.ts
import { describe, expect, it } from "vitest";
import { validateReferenceImages } from "@/lib/gemini-client";

function createFile(size: number, type: string, name = "sample.png") {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateReferenceImages", () => {
  it("accepts up to 3 jpg/png/webp images", () => {
    const result = validateReferenceImages([
      createFile(128, "image/png"),
      createFile(256, "image/jpeg", "sample.jpg"),
      createFile(512, "image/webp", "sample.webp"),
    ]);

    expect(result).toHaveLength(3);
  });

  it("rejects more than 3 images", () => {
    expect(() =>
      validateReferenceImages([
        createFile(1, "image/png", "1.png"),
        createFile(1, "image/png", "2.png"),
        createFile(1, "image/png", "3.png"),
        createFile(1, "image/png", "4.png"),
      ]),
    ).toThrow("最多上传 3 张参考图");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/generate-upload.test.ts`
Expected: FAIL with missing export `validateReferenceImages`

- [ ] **Step 3: Implement shared validation and route form parsing**

```ts
// /root/nanobaba/lib/gemini-client.ts
const MAX_REFERENCE_IMAGES = 3;
const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_REFERENCE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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

export async function fileToInlineImageInput(file: File): Promise<InlineImageInput> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    mimeType: file.type,
    data: buffer.toString("base64"),
  };
}
```

```ts
// /root/nanobaba/app/api/generate/route.ts
import {
  fileToInlineImageInput,
  generateImage,
  validateReferenceImages,
} from "@/lib/gemini-client";

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/generate-upload.test.ts tests/unit/gemini-client.test.ts`
Expected: PASS with `4 passed`

- [ ] **Step 5: Commit**

```bash
git add tests/unit/generate-upload.test.ts lib/gemini-client.ts app/api/generate/route.ts
git commit -m "feat: add reference image validation and upload route"
```

### Task 3: Add upload UI and client-side validation

**Files:**
- Modify: `/root/nanobaba/components/prompt-composer.tsx`
- Modify: `/root/nanobaba/tests/e2e/generate.spec.ts`

- [ ] **Step 1: Write the failing upload E2E tests**

```ts
// /root/nanobaba/tests/e2e/generate.spec.ts
test("shows selected reference image previews before generation", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("请输入密码").fill("test-password");
  await page.getByRole("button", { name: "登录" }).click();

  await page.setInputFiles('input[type="file"]', {
    name: "ref-1.png",
    mimeType: "image/png",
    buffer: Buffer.from("fake-image"),
  });

  await expect(page.getByText("已选参考图")).toBeVisible();
  await expect(page.getByText("ref-1.png")).toBeVisible();
});

test("blocks selecting more than 3 reference images", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("请输入密码").fill("test-password");
  await page.getByRole("button", { name: "登录" }).click();

  await page.setInputFiles('input[type="file"]', [
    { name: "1.png", mimeType: "image/png", buffer: Buffer.from("1") },
    { name: "2.png", mimeType: "image/png", buffer: Buffer.from("2") },
    { name: "3.png", mimeType: "image/png", buffer: Buffer.from("3") },
    { name: "4.png", mimeType: "image/png", buffer: Buffer.from("4") },
  ]);

  await expect(page.getByText("最多上传 3 张参考图")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/generate.spec.ts`
Expected: FAIL because there is no file input or preview UI

- [ ] **Step 3: Implement upload UI and `FormData` submission**

```tsx
// /root/nanobaba/components/prompt-composer.tsx
"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type SelectedReferenceImage = {
  file: File;
  objectUrl: string;
};

export function PromptComposer() {
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [referenceImages, setReferenceImages] = useState<SelectedReferenceImage[]>([]);

  const canGenerate = useMemo(() => {
    return !pending && prompt.trim().length > 0;
  }, [pending, prompt]);

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 3) {
      setError("最多上传 3 张参考图");
      event.target.value = "";
      return;
    }

    const invalidFile = files.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 10 * 1024 * 1024,
    );

    if (invalidFile) {
      setError(
        invalidFile.size > 10 * 1024 * 1024
          ? "单张图片不能超过 10MB"
          : "仅支持 JPG、PNG、WebP",
      );
      event.target.value = "";
      return;
    }

    setError("");
    setReferenceImages(
      files.map((file) => ({
        file,
        objectUrl: URL.createObjectURL(file),
      })),
    );
  }

  async function handleGenerate() {
    setPending(true);
    setError("");

    const formData = new FormData();
    formData.append("prompt", prompt);

    for (const image of referenceImages) {
      formData.append("referenceImages", image.file);
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setPending(false);
      setError(payload?.error ?? "生成失败，请稍后再试");
      return;
    }

    const result = (await response.json()) as {
      imageUrl: string;
      prompt: string;
      createdAt: string;
    };

    window.dispatchEvent(
      new CustomEvent("nanobaba:generation-success", { detail: result }),
    );
    window.dispatchEvent(new Event("nanobaba:history-refresh"));
    setPending(false);
  }

  function removeReferenceImage(index: number) {
    setReferenceImages((current) => {
      const next = [...current];
      const [removed] = next.splice(index, 1);
      removed?.objectUrl && URL.revokeObjectURL(removed.objectUrl);
      return next;
    });
  }

  return (
    <Card className="p-6 md:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
            prompt
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            输入想看的画面
          </h2>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">
          中文提示词优先
        </span>
      </div>
      <Textarea
        className="mt-5"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="例如：帮我生成一张春天傍晚的花园照片，暖色调，自然光，写实风格"
      />
      <label className="mt-5 block rounded-2xl border border-dashed border-stone-300 bg-white/70 p-4 text-sm text-stone-600">
        <span className="font-medium text-stone-800">上传参考图</span>
        <span className="mt-1 block text-xs">最多 3 张，支持 JPG / PNG / WebP</span>
        <input
          className="mt-3 block w-full text-sm"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFilesSelected}
        />
      </label>

      {referenceImages.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-medium text-stone-800">已选参考图</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {referenceImages.map((image, index) => (
              <li key={`${image.file.name}-${index}`} className="rounded-2xl border border-stone-200 bg-white p-3">
                <img
                  className="aspect-square w-full rounded-xl object-cover"
                  src={image.objectUrl}
                  alt={image.file.name}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-stone-600">{image.file.name}</p>
                  <button
                    className="text-xs text-rose-600"
                    type="button"
                    onClick={() => removeReferenceImage(index)}
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <Alert className="mt-4">{error}</Alert> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={!canGenerate} onClick={handleGenerate}>
          {pending ? "生成中..." : "生成图片"}
        </Button>
        <Button
          className="bg-stone-200 text-stone-900 hover:bg-stone-300"
          onClick={() => {
            setPrompt("");
            setReferenceImages([]);
            setError("");
          }}
        >
          清空
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- tests/e2e/generate.spec.ts`
Expected: PASS with the upload preview and over-limit scenarios green

- [ ] **Step 5: Commit**

```bash
git add components/prompt-composer.tsx tests/e2e/generate.spec.ts
git commit -m "feat: add reference image upload ui"
```

### Task 4: Keep remote dev access working and verify the full flow

**Files:**
- Modify: `/root/nanobaba/next.config.ts`

- [ ] **Step 1: Keep `allowedDevOrigins` in source control**

```ts
// /root/nanobaba/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["115.191.25.14"],
  typedRoutes: true,
};

export default nextConfig;
```

- [ ] **Step 2: Smoke-test the remote dev startup path**

Run: `NEXT_TELEMETRY_DISABLED=1 npm run dev -- --hostname 0.0.0.0 --port 3001`
Expected: STARTS and prints `Network:       http://0.0.0.0:3001`

- [ ] **Step 3: Run full verification**

Run: `npm test`
Expected: PASS with all unit tests green

Run: `npm run test:e2e`
Expected: PASS with all upload and generation scenarios green

Run: `APP_PASSWORD=test-password SESSION_SECRET=12345678901234567890123456789012 GEMINI_PROXY_BASE_URL=https://example.invalid GEMINI_PROXY_API_KEY=test-key GEMINI_IMAGE_MODEL=gemini-3.1-flash-image DATABASE_URL=file:./data/build.db IMAGE_STORAGE_DIR=./data/build-images NEXT_TELEMETRY_DISABLED=1 npm run build`
Expected: PASS with a production Next.js build

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: finish multi-image Gemini native flow"
```
