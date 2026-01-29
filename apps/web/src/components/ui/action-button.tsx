"use client";

import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActionButtonProps
  extends Omit<ComponentProps<typeof Button>, "children"> {
  icon: LucideIcon;
  label: string;
  href?: Route;
  onClick?: () => void;
}

export function ActionButton({
  icon: Icon,
  label,
  href,
  onClick,
  className,
  ...buttonProps
}: ActionButtonProps) {
  const isMobile = useIsMobile();

  const buttonContent = isMobile ? (
    <>
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </>
  ) : (
    <>
      <Icon className="h-4 w-4" /> {label}
    </>
  );

  const button = (
    <Button
      className={
        isMobile ? className : `flex items-center gap-2 ${className || ""}`
      }
      onClick={onClick}
      size={isMobile ? "icon" : "default"}
      {...buttonProps}
    >
      {buttonContent}
    </Button>
  );

  if (href) {
    return <Link href={href}>{button}</Link>;
  }

  return button;
}
