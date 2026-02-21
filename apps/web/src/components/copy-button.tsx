"use client";

import { CheckIcon, ClipboardIcon } from "lucide-react";
import { type ComponentProps, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends ComponentProps<"button"> {
  className?: string;
  text?: string;
  value: string;
}

export function CopyButton({
  value,
  text,
  className,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  function handleCopyToClipboard(value: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast.success("Copiado para a área de transferência");
      })
      .catch((err) => {
        toast.error("Falha ao copiar");
        console.error("Falha ao copiar: ", err);
      });
  }

  useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, []);

  return (
    <Button
      className={cn(
        text ? "h-6 px-2" : "size-4 px-0",
        "justify-start [&_svg]:size-3",
        className
      )}
      onClick={() => {
        handleCopyToClipboard(value);
        setHasCopied(true);
      }}
      size="sm"
      variant="ghost"
      {...props}
    >
      {hasCopied ? <CheckIcon className="text-primary" /> : <ClipboardIcon />}
      {text && <span className="text-muted-foreground text-xs">{text}</span>}
    </Button>
  );
}
