"use client";

import { Search, X } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRoleLabel, ROLE_LABELS_WITH_CONTEXT } from "@/lib/role-labels";

interface Tenant {
  id: string;
  name: string;
}

interface UsersFiltersProps {
  onRoleChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onShowDeletedChange: (value: boolean) => void;
  onTenantChange: (value: string) => void;
  search: string;
  selectedRole: string;
  selectedTenant: string;
  showDeleted: boolean;
  tenants: Tenant[];
}

export function UsersFilters({
  search,
  selectedTenant,
  selectedRole,
  showDeleted,
  tenants,
  onSearchChange,
  onTenantChange,
  onRoleChange,
  onShowDeletedChange,
}: UsersFiltersProps) {
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

  const roleOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "all", label: "Todas as funções" },
      ...Object.entries(ROLE_LABELS_WITH_CONTEXT).map(([value, label]) => ({
        value,
        label: label as string,
      })),
    ],
    []
  );

  // Labels para filtros ativos
  const activeFilters = [
    selectedTenant !== "all" && {
      id: "tenant",
      label: tenants.find((t) => t.id === selectedTenant)?.name || "Cliente",
      onClear: () => onTenantChange("all"),
    },
    selectedRole !== "all" && {
      id: "role",
      label: getRoleLabel(selectedRole, true),
      onClear: () => onRoleChange("all"),
    },
    showDeleted && {
      id: "deleted",
      label: "Deletados",
      onClear: () => onShowDeletedChange(false),
    },
  ].filter(Boolean) as { id: string; label: string; onClear: () => void }[];

  const handleResetFilters = () => {
    onTenantChange("all");
    onRoleChange("all");
    onShowDeletedChange(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Campo de busca */}
      <div className="relative w-full max-w-xs">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome ou email..."
          value={search}
        />
      </div>

      {/* Filtros diretos (sem popover pois são apenas 2) */}
      <div className="w-44">
        <Combobox
          emptyMessage="Nenhum cliente encontrado."
          onValueChange={onTenantChange}
          options={tenantOptions}
          placeholder="Cliente"
          searchPlaceholder="Buscar cliente..."
          value={selectedTenant}
        />
      </div>

      <div className="w-44">
        <Combobox
          emptyMessage="Nenhuma função encontrada."
          onValueChange={onRoleChange}
          options={roleOptions}
          placeholder="Função"
          searchPlaceholder="Buscar função..."
          value={selectedRole}
        />
      </div>

      {/* Filtro de deletados */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={showDeleted}
          id="show-deleted"
          onCheckedChange={(checked) => onShowDeletedChange(checked === true)}
        />
        <Label
          className="cursor-pointer font-normal text-sm"
          htmlFor="show-deleted"
        >
          Mostrar deletados
        </Label>
      </div>

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
          <Button onClick={handleResetFilters} size="sm" variant="ghost">
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
}
