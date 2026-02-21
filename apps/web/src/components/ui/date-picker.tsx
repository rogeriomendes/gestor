"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  className?: string;
  disabled?: boolean;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  value: Date | undefined;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  const triggerContent = (
    <>
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value ? (
        format(value, "dd/MM/yyyy", { locale: ptBR })
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
    </>
  );

  const calendarContent = (
    <Calendar
      locale={ptBR}
      mode="single"
      onSelect={handleSelect}
      selected={value}
    />
  );

  if (!isMobile) {
    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button
              className={cn(
                "w-full justify-start font-normal",
                !value && "text-muted-foreground",
                className
              )}
              disabled={disabled}
              variant="outline"
            />
          }
        >
          {triggerContent}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          {calendarContent}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <Button
        className={cn(
          "w-full justify-start font-normal",
          !value && "text-muted-foreground",
          className
        )}
        disabled={disabled}
        onClick={() => setOpen(true)}
        variant="outline"
      >
        {triggerContent}
      </Button>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{placeholder}</DrawerTitle>
          <DrawerDescription>Selecione uma data</DrawerDescription>
        </DrawerHeader>
        <div className="flex justify-center p-4 pb-8">{calendarContent}</div>
      </DrawerContent>
    </Drawer>
  );
}
