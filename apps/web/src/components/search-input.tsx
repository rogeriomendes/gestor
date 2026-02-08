"use client";

import { SearchIcon, XIcon } from "lucide-react";
import * as React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export interface SearchInputProps
  extends Omit<
    React.ComponentProps<"input">,
    "value" | "onChange" | "placeholder"
  > {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
  icon?: React.ReactNode;
  className?: string;
  /** Quando true, F9 foca o input e exibe a dica do atalho quando vazio. Padrão: false */
  enableF9Shortcut?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Pesquisar...",
  clearable = true,
  icon,
  className,
  enableF9Shortcut = false,
  ...inputProps
}: SearchInputProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const clearInput = () => {
    onChange("");
  };

  React.useEffect(() => {
    if (!enableF9Shortcut) return;
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "F9") {
        const input = wrapperRef.current?.querySelector<HTMLInputElement>(
          "[data-slot=input-group-control]"
        );
        input?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [enableF9Shortcut]);

  React.useEffect(() => {
    const handleEscapeKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onChange("");
        event.preventDefault();
      }
    };
    document.addEventListener("keydown", handleEscapeKeyPress);
    return () => {
      document.removeEventListener("keydown", handleEscapeKeyPress);
    };
  }, [onChange]);

  let endAddon: React.ReactNode = null;
  if (value.length > 0 && clearable) {
    endAddon = (
      <InputGroupAddon align="inline-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <InputGroupButton
                aria-label="Limpar"
                className="cursor-pointer"
                onClick={clearInput}
                size="icon-xs"
                type="button"
                variant="ghost"
              />
            }
          >
            <XIcon className="size-4 cursor-pointer" onClick={clearInput} />
          </TooltipTrigger>
          <TooltipContent>
            Limpar {"  "}
            <kbd className="ml-1.5 hidden rounded bg-primary-foreground px-1 text-primary text-xs sm:inline">
              ESC
            </kbd>
          </TooltipContent>
        </Tooltip>
      </InputGroupAddon>
    );
  } else if (value.length === 0 && enableF9Shortcut) {
    endAddon = (
      <InputGroupAddon align="inline-end">
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-muted-foreground text-xs opacity-100">
          F9
        </kbd>
      </InputGroupAddon>
    );
  }

  return (
    <div ref={wrapperRef}>
      <InputGroup className={cn("w-full md:w-64 lg:w-96", className)}>
        <InputGroupAddon align="inline-start">
          {icon ?? <SearchIcon className="size-4" />}
        </InputGroupAddon>
        <InputGroupInput
          onChange={handleChange}
          placeholder={placeholder}
          type="text"
          value={value}
          {...inputProps}
        />
        {endAddon}
      </InputGroup>
    </div>
  );
}
