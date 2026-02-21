"use client";

import { Search, X } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { getPlanStatusLabel } from "@/lib/status-labels";

interface PlansFiltersProps {
  onResetFilters: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  search: string;
  selectedStatus: string;
}

export function PlansFilters({
  search,
  selectedStatus,
  onSearchChange,
  onStatusChange,
  onResetFilters,
}: PlansFiltersProps) {
  const statusOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "all", label: "Todos os status" },
      { value: "active", label: "Ativos" },
      { value: "inactive", label: "Inativos" },
    ],
    []
  );

  const hasActiveFilters = selectedStatus !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Campo de busca */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome..."
          value={search}
        />
      </div>

      {/* Filtro de status direto (sem popover) */}
      <div className="w-40">
        <Combobox
          emptyMessage="Nenhum status encontrado."
          onValueChange={onStatusChange}
          options={statusOptions}
          placeholder="Status"
          searchPlaceholder="Buscar status..."
          value={selectedStatus}
        />
      </div>

      {/* Badge de filtro ativo */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5">
          <Badge className="gap-1 pr-1" variant="secondary">
            {getPlanStatusLabel(selectedStatus)}
            <button
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              onClick={() => onStatusChange("all")}
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
          <Button onClick={onResetFilters} size="sm" variant="ghost">
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
