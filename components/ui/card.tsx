import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-stone-200/80 bg-[--panel] shadow-[0_20px_60px_rgba(120,94,45,0.08)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
