"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function PromptComposer() {
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setPending(true);
    setError("");

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      setPending(false);
      setError("生成失败，请稍后再试");
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
      {error ? <Alert className="mt-4">{error}</Alert> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          disabled={pending || prompt.trim().length === 0}
          onClick={handleGenerate}
        >
          {pending ? "生成中..." : "生成图片"}
        </Button>
        <Button
          className="bg-stone-200 text-stone-900 hover:bg-stone-300"
          onClick={() => setPrompt("")}
        >
          清空
        </Button>
      </div>
    </Card>
  );
}
