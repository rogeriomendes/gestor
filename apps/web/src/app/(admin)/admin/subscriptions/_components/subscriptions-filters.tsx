"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const STATUS_LABELS: Record<string, string> = {
  TRIAL: "Trial",
  ACTIVE: "Ativa",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
};

interface Tenant {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
}

interface SubscriptionsFiltersProps {
  selectedStatus: string;
  selectedTenant: string;
  selectedPlan: string;
  tenants: Tenant[];
  plans: Plan[];
  onStatusChange: (value: string) => void;
  onTenantChange: (value: string) => void;
  onPlanChange: (value: string) => void;
  onResetFilters: () => void;
}

export function SubscriptionsFilters({
  selectedStatus,
  selectedTenant,
  selectedPlan,
  tenants,
  plans,
  onStatusChange,
  onTenantChange,
  onPlanChange,
  onResetFilters,
}: SubscriptionsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "all", label: "Todos os status" },
      ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    []
  );

  const tenantOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "all", label: "Todos os clientes" },
      ...tenants.map((tenant) => ({
        value: tenant.id,
        label: tenant.name,
      })),
    ],
    [tenants]
  );

  const planOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "all", label: "Todos os planos" },
      ...plans.map((plan) => ({
        value: plan.id,
        label: plan.name,
      })),
    ],
    [plans]
  );

  // Conta filtros ativos
  const activeFiltersCount = [
    selectedStatus !== "all",
    selectedTenant !== "all",
    selectedPlan !== "all",
  ].filter(Boolean).length;

  // Labels para filtros ativos
  const activeFilters = [
    selectedStatus !== "all" && {
      id: "status",
      label: STATUS_LABELS[selectedStatus] || selectedStatus,
      onClear: () => onStatusChange("all"),
    },
    selectedTenant !== "all" && {
      id: "tenant",
      label: tenants.find((t) => t.id === selectedTenant)?.name || "Cliente",
      onClear: () => onTenantChange("all"),
    },
    selectedPlan !== "all" && {
      id: "plan",
      label: plans.find((p) => p.id === selectedPlan)?.name || "Plano",
      onClear: () => onPlanChange("all"),
    },
  ].filter(Boolean) as { id: string; label: string; onClear: () => void }[];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverTrigger
          render={
            <Button size="sm" variant="outline">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          }
        />

        <PopoverContent align="start" className="w-[320px] p-4">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <span className="font-medium text-muted-foreground text-xs">
                Status
              </span>
              <Combobox
                emptyMessage="Nenhum status encontrado."
                onValueChange={onStatusChange}
                options={statusOptions}
                placeholder="Todos os status"
                searchPlaceholder="Buscar status..."
                value={selectedStatus}
              />
            </div>

            <div className="space-y-1.5">
              <span className="font-medium text-muted-foreground text-xs">
                Cliente
              </span>
              <Combobox
                emptyMessage="Nenhum cliente encontrado."
                onValueChange={onTenantChange}
                options={tenantOptions}
                placeholder="Todos os clientes"
                searchPlaceholder="Buscar cliente..."
                value={selectedTenant}
              />
            </div>

            <div className="space-y-1.5">
              <span className="font-medium text-muted-foreground text-xs">
                Plano
              </span>
              <Combobox
                emptyMessage="Nenhum plano encontrado."
                onValueChange={onPlanChange}
                options={planOptions}
                placeholder="Todos os planos"
                searchPlaceholder="Buscar plano..."
                value={selectedPlan}
              />
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="mt-4 flex justify-end border-t pt-4">
              <Button onClick={onResetFilters} size="sm" variant="ghost">
                <X className="mr-1 h-3 w-3" />
                Limpar filtros
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Badges de filtros ativos */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((filter) => (
            <Badge className="gap-1 pr-1" key={filter.id} variant="secondary">
              {filter.label}
              <button
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={filter.onClear}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
