"use client";

import { cn } from "@/lib/utils";

interface StatusDotLabelProps {
  dotClassName?: string;
  label: string;
  size?: "sm" | "md";
}

export function StatusDotLabel({
  dotClassName,
  label,
  size = "md",
}: StatusDotLabelProps) {
  return (
    <span
      className={cn("flex items-center", size === "sm" ? "gap-1.5" : "gap-2")}
    >
      <span
        className={cn(
          "shrink-0 rounded-full",
          size === "sm" ? "size-1.5" : "size-2.25",
          dotClassName ?? "bg-muted-foreground/40"
        )}
      />
      <span>{label}</span>
    </span>
  );
}
