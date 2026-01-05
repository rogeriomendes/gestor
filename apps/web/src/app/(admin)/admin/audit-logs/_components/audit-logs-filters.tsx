"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_TYPE_LABELS,
  getAuditActionLabel,
  getAuditResourceTypeLabel,
} from "@/lib/audit-labels";
import { formatDate } from "@/lib/date-utils";

interface Tenant {
  id: string;
  name: string;
}

interface User {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

interface AuditLogsFiltersProps {
  selectedAction: string;
  selectedResourceType: string;
  selectedTenant: string;
  selectedUser: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  tenants: Tenant[];
  users: User[];
  onActionChange: (value: string) => void;
  onResourceTypeChange: (value: string) => void;
  onTenantChange: (value: string) => void;
  onUserChange: (value: string) => void;
  onStartDateChange: (value: Date | undefined) => void;
  onEndDateChange: (value: Date | undefined) => void;
  onResetFilters: () => void;
}

export function AuditLogsFilters({
  selectedAction,
  selectedResourceType,
  selectedTenant,
  selectedUser,
  startDate,
  endDate,
  tenants,
  users,
  onActionChange,
  onResourceTypeChange,
  onTenantChange,
  onUserChange,
  onStartDateChange,
  onEndDateChange,
  onResetFilters,
}: AuditLogsFiltersProps) {
  const actionOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "all", label: "Todas as ações" },
      ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    ],
    []
  );

  const resourceTypeOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "all", label: "Todos os tipos" },
      ...Object.entries(AUDIT_RESOURCE_TYPE_LABELS).map(([value, label]) => ({
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

  const userOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "all", label: "Todos os usuários" },
      ...users.map((user) => ({
        value: user.id,
        label: `${user.user.name} (${user.user.email})`,
      })),
    ],
    [users]
  );

  const [isOpen, setIsOpen] = useState(false);

  // Conta filtros ativos
  const activeFiltersCount = [
    selectedAction !== "all",
    selectedResourceType !== "all",
    selectedTenant !== "all",
    selectedUser !== "all",
    startDate !== undefined,
    endDate !== undefined,
  ].filter(Boolean).length;

  // Labels para filtros ativos
  const activeFilters = [
    selectedAction !== "all" && {
      id: "action",
      label: getAuditActionLabel(selectedAction),
      onClear: () => onActionChange("all"),
    },
    selectedResourceType !== "all" && {
      id: "resourceType",
      label: getAuditResourceTypeLabel(selectedResourceType),
      onClear: () => onResourceTypeChange("all"),
    },
    selectedTenant !== "all" && {
      id: "tenant",
      label: tenants.find((t) => t.id === selectedTenant)?.name || "Cliente",
      onClear: () => onTenantChange("all"),
    },
    selectedUser !== "all" && {
      id: "user",
      label: users.find((u) => u.id === selectedUser)?.user.name || "Usuário",
      onClear: () => onUserChange("all"),
    },
    startDate && {
      id: "startDate",
      label: `De: ${formatDate(startDate)}`,
      onClear: () => onStartDateChange(undefined),
    },
    endDate && {
      id: "endDate",
      label: `Até: ${formatDate(endDate)}`,
      onClear: () => onEndDateChange(undefined),
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

        <PopoverContent align="start" className="w-[520px] p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <span className="font-medium text-muted-foreground text-xs">
                Ação
              </span>
              <Combobox
                emptyMessage="Nenhuma ação encontrada."
                onValueChange={onActionChange}
                options={actionOptions}
                placeholder="Todas as ações"
                searchPlaceholder="Buscar ação..."
                value={selectedAction}
              />
            </div>

            <div className="space-y-1.5">
              <span className="font-medium text-muted-foreground text-xs">
                Tipo de Recurso
              </span>
              <Combobox
                emptyMessage="Nenhum tipo encontrado."
                onValueChange={onResourceTypeChange}
                options={resourceTypeOptions}
                placeholder="Todos os tipos"
                searchPlaceholder="Buscar tipo..."
                value={selectedResourceType}
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
                Usuário
              </span>
              <Combobox
                emptyMessage="Nenhum usuário encontrado."
                onValueChange={onUserChange}
                options={userOptions}
                placeholder="Todos os usuários"
                searchPlaceholder="Buscar usuário..."
                value={selectedUser}
              />
            </div>

            <div className="space-y-1.5">
              <span className="font-medium text-muted-foreground text-xs">
                Data Inicial
              </span>
              <DatePicker
                onChange={onStartDateChange}
                placeholder="Data inicial"
                value={startDate}
              />
            </div>

            <div className="space-y-1.5">
              <span className="font-medium text-muted-foreground text-xs">
                Data Final
              </span>
              <DatePicker
                onChange={onEndDateChange}
                placeholder="Data final"
                value={endDate}
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
