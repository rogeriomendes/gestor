"use client";

import { ChevronsUpDown } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  /** Ícone exibido à esquerda do texto no trigger (ex.: GroupIcon, ScaleIcon) */
  icon?: ReactNode;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  icon,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
  };

  const triggerContent = (
    <>
      <span className="flex flex-1 items-center gap-2 truncate">
        {icon ? (
          <span className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:opacity-70">
            {icon}
          </span>
        ) : null}
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
    </>
  );

  const CommandContent = (
    <Command>
      <CommandInput placeholder={searchPlaceholder} />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              data-checked={value === option.value}
              key={option.value}
              onSelect={() => handleSelect(option.value)}
              value={option.label}
            >
              {option.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (!isMobile) {
    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button
              aria-expanded={open}
              className={cn("justify-between font-normal", className)}
              role="combobox"
              variant="outline"
            />
          }
        >
          {triggerContent}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--anchor-width] p-0">
          {CommandContent}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("justify-between font-normal", className)}
          onClick={() => setOpen(true)}
          role="combobox"
          variant="outline"
        >
          {triggerContent}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{placeholder}</DrawerTitle>
          <DrawerDescription>Selecione uma opção da lista</DrawerDescription>
        </DrawerHeader>
        <div className="p-2 pt-4">{CommandContent}</div>
      </DrawerContent>
    </Drawer>
  );
}
