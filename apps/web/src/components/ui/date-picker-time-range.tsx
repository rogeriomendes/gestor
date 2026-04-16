"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useMemo } from "react";

interface DatePickerTimeRangeProps {
  className?: string;
  date: Date | undefined;
  disabled?: boolean;
  onDateChange: (date: Date | undefined) => void;
  onTimeFromChange: (time: string) => void;
  onTimeToChange: (time: string) => void;
  placeholder?: string;
  timeFrom: string;
  timeTo: string;
}

const TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, "0");
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

export function DatePickerTimeRange({
  className,
  date,
  disabled = false,
  onDateChange,
  onTimeFromChange,
  onTimeToChange,
  placeholder = "Data e horário",
  timeFrom,
  timeTo,
}: DatePickerTimeRangeProps) {
  const label = useMemo(() => {
    if (!date) {
      return null;
    }
    const from = timeFrom || "00:00";
    const to = timeTo || "23:59";
    return `${formatDate(date, true)} ${from} - ${to}`;
  }, [date, timeFrom, timeTo]);

  return (
    <Popover>
      <PopoverTrigger
        nativeButton={false}
        render={
          <div
            aria-disabled={disabled}
            className={cn(
              buttonVariants({ size: "default", variant: "outline" }),
              "w-full justify-between px-3 text-left font-normal",
              !label && "text-muted-foreground",
              disabled && "pointer-events-none opacity-50",
              className
            )}
            role="button"
            tabIndex={disabled ? -1 : 0}
          />
        }
      >
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center">
            <CalendarIcon className="mr-2 size-4 shrink-0" />
            {label ?? (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="space-y-3">
          <Calendar
            captionLayout="dropdown"
            disabled={{ after: new Date() }}
            mode="single"
            onSelect={onDateChange}
            selected={date}
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Hora inicial</Label>
              <Select
                onValueChange={(value) => onTimeFromChange(value ?? "")}
                value={timeFrom || "00:00"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Inicial" />
                </SelectTrigger>
                <SelectContent className="min-w-(--anchor-width)">
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Hora final</Label>
              <Select
                onValueChange={(value) => onTimeToChange(value ?? "")}
                value={timeTo || "23:59"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Final" />
                </SelectTrigger>
                <SelectContent className="min-w-(--anchor-width)">
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                onDateChange(undefined);
                onTimeFromChange("");
                onTimeToChange("");
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Limpar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
