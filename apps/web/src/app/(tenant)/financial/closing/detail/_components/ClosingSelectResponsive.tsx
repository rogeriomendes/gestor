"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

export interface ClosingSelectResponsiveOption {
  label: string;
  listLabel: string;
  value: string;
}

const defaultTriggerClassName =
  "w-56 cursor-pointer items-center rounded-md border border-transparent bg-secondary px-2 py-3.5 font-medium text-base text-secondary-foreground hover:bg-secondary/80 data-[size=default]:h-5 md:w-64 md:text-lg dark:bg-secondary dark:hover:bg-secondary/80";

interface ClosingSelectResponsiveProps {
  disabled?: boolean;
  drawerDescription?: string;
  drawerTitle?: string;
  onValueChange: (value: string) => void;
  options: ClosingSelectResponsiveOption[];
  placeholder?: string;
  triggerClassName?: string;
  value: string;
}

export function ClosingSelectResponsive({
  options,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Selecionar outro fechamento",
  drawerTitle = "Fechamentos",
  drawerDescription = "Escolha um fechamento da lista",
  triggerClassName,
}: ClosingSelectResponsiveProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const triggerCn = cn(defaultTriggerClassName, triggerClassName);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  const handlePick = (next: string) => {
    if (!next) {
      return;
    }
    onValueChange(next);
    setOpen(false);
  };

  if (!isMobile) {
    return (
      <Select
        disabled={disabled || options.length === 0}
        onValueChange={(value) => handlePick(value || "")}
        value={value}
      >
        <SelectTrigger className={triggerCn}>
          <span className="justify-center truncate">{displayLabel}</span>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.listLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(triggerCn, "justify-between font-normal")}
          disabled={disabled || options.length === 0}
          type="button"
          variant="secondary"
        >
          <span
            className={cn(
              "flex flex-1 truncate text-left",
              selected ? "text-secondary-foreground" : "text-muted-foreground"
            )}
          >
            {displayLabel}
          </span>
          <ChevronDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{drawerTitle}</DrawerTitle>
          <DrawerDescription>{drawerDescription}</DrawerDescription>
        </DrawerHeader>
        <div className="p-2 pt-4">
          <Command shouldFilter={false}>
            <CommandList>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    data-checked={value === option.value}
                    key={option.value}
                    onSelect={() => handlePick(option.value)}
                    value={option.value}
                  >
                    {option.listLabel}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
