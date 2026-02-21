"use client";

import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface InfoPopoverProps {
  children: ReactNode;
  className?: string;
  content?: ReactNode;
  contentClassName?: string;
  label: string;
  triggerClassName?: string;
}

export function InfoPopover({
  children,
  label,
  content,
  className,
  triggerClassName,
  contentClassName,
}: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger className={triggerClassName}>
        <span className={cn("cursor-pointer", className)}>{children}</span>
      </PopoverTrigger>
      <PopoverContent className={cn("w-full p-2 text-xs", contentClassName)}>
        {content || label}
      </PopoverContent>
    </Popover>
  );
}
