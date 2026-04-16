"use client";

import { Button } from "@/components/ui/button";
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
import type { ReactNode } from "react";

interface FiltersPanelProps {
  children: ReactNode;
  description?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  popoverClassName?: string;
  title: string;
  triggerIcon?: ReactNode;
  triggerLabel?: string;
}

export function FiltersPanel({
  children,
  description = "Selecione os filtros para refinar os resultados.",
  open,
  onOpenChange,
  popoverClassName,
  title,
  triggerIcon,
  triggerLabel = "Filtros",
}: FiltersPanelProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer onOpenChange={onOpenChange} open={open}>
        <DrawerTrigger asChild>
          <Button size="icon" type="button" variant="outline">
            {triggerIcon}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left">{title}</DrawerTitle>
            <DrawerDescription className="text-left">
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-2 pb-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger
        render={<Button size="default" type="button" variant="outline" />}
      >
        {triggerIcon}
        {triggerLabel}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-96 p-2", popoverClassName)}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
