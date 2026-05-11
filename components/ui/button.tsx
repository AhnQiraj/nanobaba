import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  type = "button",
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "default" &&
          "bg-stone-900 text-stone-50 hover:bg-stone-700",
        variant === "outline" &&
          "border border-stone-300 bg-white/70 text-stone-900 hover:bg-stone-100",
        className,
      )}
      {...props}
    />
  );
}
