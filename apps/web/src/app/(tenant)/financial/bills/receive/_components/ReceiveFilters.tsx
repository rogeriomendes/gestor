"use client";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker, type DateRange } from "@/components/ui/date-picker";
import { Settings2Icon } from "lucide-react";

interface ReceiveFiltersProps {
  dateRange?: DateRange;
  onClearFilters: () => void;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
  onStatusChange: (value: string) => void;
  status?: string;
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

  const _hasActiveFilters =
    (status && status !== "0") || dateRange?.from || dateRange?.to;

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
      {/* Status da Parcela */}
      <div className="flex flex-row gap-2 md:gap-3">
        <Combobox
          className="flex-1 md:w-48"
          icon={<Settings2Icon className="size-4" />}
          onValueChange={onStatusChange}
          options={statusOptions}
          placeholder="Status"
          searchPlaceholder="Buscar status..."
          value={status}
        />

        {/* Período - Data de Lançamento */}
        <DatePicker
          calendarCaptionLayout="dropdown"
          // calendarDisabled={{ after: new Date() }}
          className="flex-1 md:w-60"
          mode="range"
          onChange={onDateRangeChange}
          placeholder="Selecionar período"
          value={dateRange}
        />
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
