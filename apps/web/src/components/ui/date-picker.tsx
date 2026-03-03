"use client";

import { ptBR } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";
import type { ComponentProps, MouseEvent } from "react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export type { DateRange };

export type CalendarDisabled =
  | ((date: Date) => boolean)
  | { after?: Date; before?: Date; from?: Date; to?: Date };

interface DatePickerBaseProps {
  calendarCaptionLayout?:
    | "dropdown"
    | "label"
    | "dropdown-months"
    | "dropdown-years";
  calendarDisabled?: CalendarDisabled;
  className?: string;
  clearable?: boolean;
  closeOnSelect?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export type DatePickerPropsSingle = DatePickerBaseProps & {
  mode?: "single";
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
};

export type DatePickerPropsRange = DatePickerBaseProps & {
  mode: "range";
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
};

export type DatePickerProps = DatePickerPropsSingle | DatePickerPropsRange;

function isRangeMode(props: DatePickerProps): props is DatePickerPropsRange {
  return props.mode === "range";
}

export function DatePicker(props: DatePickerProps) {
  const {
    placeholder = isRangeMode(props)
      ? "Selecionar período"
      : "Selecione uma data",
    className,
    disabled = false,
    clearable = true,
    closeOnSelect = true,
    calendarCaptionLayout = "label",
    calendarDisabled,
  } = props;

  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const isRange = isRangeMode(props);
  const value = props.value;
  const onChange = props.onChange;

  const handleSelectSingle = (date: Date | undefined) => {
    (onChange as (date: Date | undefined) => void)(date);
    if (closeOnSelect) {
      setOpen(false);
    }
  };

  const handleSelectRange = (range: DateRange | undefined) => {
    (onChange as (range: DateRange | undefined) => void)(range);
  };

  const handleClear = (e: MouseEvent<HTMLButtonElement | HTMLSpanElement>) => {
    e.stopPropagation();
    if (isRange) {
      (onChange as (range: DateRange | undefined) => void)(undefined);
    } else {
      (onChange as (date: Date | undefined) => void)(undefined);
    }
  };

  const hasValue = isRange
    ? (value as DateRange | undefined)?.from != null ||
      (value as DateRange | undefined)?.to != null
    : (value as Date | undefined) != null;

  const triggerLabel = isRange
    ? (() => {
        const range = value as DateRange | undefined;
        if (range?.from && range?.to) {
          return `${formatDate(range.from, true)} - ${formatDate(range.to, true)}`;
        }
        if (range?.from) {
          return formatDate(range.from, true);
        }
        return null;
      })()
    : (value as Date | undefined)
      ? formatDate(value as Date, true)
      : null;

  const triggerContent = (
    <div className="flex w-full flex-row items-center justify-between gap-2">
      <div className="flex min-w-0 flex-row items-center">
        <CalendarIcon
          className={cn(
            "mr-2 size-4 shrink-0",
            !hasValue && "text-muted-foreground"
          )}
        />
        {triggerLabel != null ? (
          triggerLabel
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>
      {hasValue && clearable && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Limpar"
                className="-mr-2 size-6 shrink-0 cursor-pointer"
                onClick={handleClear}
                size="icon"
                type="button"
                variant="ghost"
              />
            }
          >
            <XIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Limpar</TooltipContent>
        </Tooltip>
      )}
    </div>
  );

  const calendarContent = isRange ? (
    <Calendar
      captionLayout={calendarCaptionLayout}
      defaultMonth={(value as DateRange | undefined)?.from}
      disabled={calendarDisabled as ComponentProps<typeof Calendar>["disabled"]}
      locale={ptBR}
      mode="range"
      onSelect={handleSelectRange}
      selected={value as DateRange | undefined}
    />
  ) : (
    <Calendar
      captionLayout={calendarCaptionLayout}
      disabled={calendarDisabled as ComponentProps<typeof Calendar>["disabled"]}
      locale={ptBR}
      mode="single"
      onSelect={handleSelectSingle}
      selected={value as Date | undefined}
    />
  );

  if (!isMobile) {
    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          nativeButton={false}
          render={
            <div
              aria-disabled={disabled}
              className={cn(
                buttonVariants({ size: "default", variant: "outline" }),
                "w-full justify-between px-3 text-left font-normal",
                !hasValue && "text-muted-foreground",
                disabled && "pointer-events-none opacity-50",
                className
              )}
              role="button"
              tabIndex={disabled ? -1 : 0}
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
      <DrawerTrigger asChild>
        <div
          aria-disabled={disabled}
          className={cn(
            buttonVariants({ size: "default", variant: "outline" }),
            "w-full justify-start font-normal",
            !hasValue && "text-muted-foreground",
            disabled && "pointer-events-none opacity-50",
            className
          )}
          onClick={disabled ? undefined : () => setOpen(true)}
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          {triggerContent}
        </div>
      </DrawerTrigger>
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
