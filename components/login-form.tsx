"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setError("密码不正确");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden p-1">
      <form
        onSubmit={onSubmit}
        className="rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(255,250,240,0.94),rgba(250,244,232,0.96))] p-7"
      >
        <p className="text-sm uppercase tracking-[0.35em] text-stone-500">
          private studio
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">
          给老婆的生图小站
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          输入家里的登录密码，就能开始生成和查看最近 30 天的图片记录。
        </p>
        <Input
          className="mt-6"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
        />
        {error ? <Alert className="mt-3">{error}</Alert> : null}
        <Button className="mt-5 w-full" type="submit">
          登录
        </Button>
      </form>
    </Card>
  );
}
