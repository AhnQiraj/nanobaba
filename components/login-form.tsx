"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-stone-200 bg-[--panel] p-6 shadow-sm"
    >
      <h1 className="text-2xl font-semibold text-stone-900">
        给老婆的生图小站
      </h1>
      <input
        className="mt-4 w-full rounded-xl border border-stone-300 px-3 py-2"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="请输入密码"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <button
        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
        type="submit"
      >
        登录
      </button>
    </form>
  );
}
