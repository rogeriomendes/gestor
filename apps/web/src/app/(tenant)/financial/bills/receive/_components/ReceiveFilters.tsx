"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Settings2Icon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ReceiveFiltersProps {
  status?: string;
  dateRange?: DateRange;
  onStatusChange: (value: string) => void;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  onClearFilters: () => void;
}

export function ReceiveFilters({
  status = "1",
  dateRange,
  onStatusChange,
  onDateRangeChange,
  onClearFilters,
}: ReceiveFiltersProps) {
  const statusOptions: ComboboxOption[] = [
    { value: "0", label: "TODOS" },
    { value: "1", label: "ABERTO" },
    { value: "2", label: "QUITADO" },
    { value: "3", label: "PARCIAL" },
  ];

  const hasActiveFilters =
    (status && status !== "0") || dateRange?.from || dateRange?.to;

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      {/* Status da Parcela */}
      <div className="flex flex-row gap-2 md:gap-3">
        <Combobox
          className="w-full md:w-48"
          icon={<Settings2Icon className="size-4" />}
          onValueChange={onStatusChange}
          options={statusOptions}
          placeholder="Status"
          value={status}
        />

        {/* Período - Data de Lançamento */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                className={cn(
                  "w-full justify-start text-left font-normal md:w-60",
                  !dateRange && "text-muted-foreground"
                )}
                variant="outline"
              />
            }
          >
            <CalendarIcon className="h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              "Selecionar período"
            )}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              captionLayout="dropdown"
              locale={ptBR}
              mode="range"
              onSelect={onDateRangeChange}
              selected={dateRange}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Botão Limpar */}
      {/* {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="h-10"
        >
          <FilterIcon className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      )} */}
    </div>
  );
}
