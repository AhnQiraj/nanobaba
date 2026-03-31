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

const MAX_REFERENCE_IMAGES = 3;
const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_REFERENCE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function PromptComposer() {
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [referenceImages, setReferenceImages] = useState<
    SelectedReferenceImage[]
  >([]);

  const canGenerate = useMemo(() => {
    return !pending && prompt.trim().length > 0;
  }, [pending, prompt]);

  function clearReferenceImages(images: SelectedReferenceImage[]) {
    for (const image of images) {
      URL.revokeObjectURL(image.objectUrl);
    }
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length > MAX_REFERENCE_IMAGES) {
      setError("最多上传 3 张参考图");
      event.target.value = "";
      return;
    }

    const invalidFile = files.find((file) => {
      return (
        !ALLOWED_REFERENCE_IMAGE_TYPES.has(file.type) ||
        file.size > MAX_REFERENCE_IMAGE_BYTES
      );
    });

    if (invalidFile) {
      setError(
        invalidFile.size > MAX_REFERENCE_IMAGE_BYTES
          ? "单张图片不能超过 10MB"
          : "仅支持 JPG、PNG、WebP",
      );
      event.target.value = "";
      return;
    }

    setError("");
    setReferenceImages((current) => {
      clearReferenceImages(current);

      return files.map((file) => ({
        file,
        objectUrl: URL.createObjectURL(file),
      }));
    });
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
      const payload = (await response
        .json()
        .catch(() => null)) as { error?: string } | null;

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
      new CustomEvent("nanobaba:generation-success", {
        detail: result,
      }),
    );
    window.dispatchEvent(new Event("nanobaba:history-refresh"));
    setPending(false);
  }

  function removeReferenceImage(index: number) {
    setReferenceImages((current) => {
      const next = [...current];
      const [removed] = next.splice(index, 1);

      if (removed) {
        URL.revokeObjectURL(removed.objectUrl);
      }

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
        <span className="mt-1 block text-xs">
          最多 3 张，支持 JPG / PNG / WebP
        </span>
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
              <li
                key={`${image.file.name}-${index}`}
                className="rounded-2xl border border-stone-200 bg-white p-3"
              >
                <img
                  className="aspect-square w-full rounded-xl object-cover"
                  src={image.objectUrl}
                  alt={image.file.name}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-stone-600">
                    {image.file.name}
                  </p>
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
            clearReferenceImages(referenceImages);
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
