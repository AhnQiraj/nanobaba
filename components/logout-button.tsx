"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      className="bg-white/80 text-stone-900 hover:bg-white"
      onClick={handleLogout}
    >
      退出登录
    </Button>
  );
}
