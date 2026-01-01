"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ACTION_LABELS: Record<string, string> = {
  CREATE_TENANT: "Criar Tenant",
  UPDATE_TENANT: "Atualizar Tenant",
  DELETE_TENANT: "Deletar Tenant",
  RESTORE_TENANT: "Restaurar Tenant",
  CREATE_USER: "Criar Usuário",
  UPDATE_USER: "Atualizar Usuário",
  UPDATE_USER_ROLE: "Atualizar Role",
  REMOVE_USER: "Remover Usuário",
  INVITE_USER: "Convidar Usuário",
  CREATE_BRANCH: "Criar Filial",
  UPDATE_BRANCH: "Atualizar Filial",
  DELETE_BRANCH: "Deletar Filial",
  RESTORE_BRANCH: "Restaurar Filial",
  UPDATE_PERMISSIONS: "Atualizar Permissões",
  INITIALIZE_PERMISSIONS: "Inicializar Permissões",
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  TENANT: "Tenant",
  USER: "Usuário",
  TENANT_USER: "Usuário do Tenant",
  BRANCH: "Filial",
  PERMISSION: "Permissão",
};

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
  startDate: string;
  endDate: string;
  tenants: Tenant[];
  users: User[];
  onActionChange: (value: string) => void;
  onResourceTypeChange: (value: string) => void;
  onTenantChange: (value: string) => void;
  onUserChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
        <CardDescription>
          Filtre os logs por ação, tipo de recurso, tenant, usuário ou data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field>
            <FieldLabel>Ação</FieldLabel>
            <Select onValueChange={onActionChange} value={selectedAction}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as ações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Tipo de Recurso</FieldLabel>
            <Select
              onValueChange={onResourceTypeChange}
              value={selectedResourceType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Tenant</FieldLabel>
            <Select onValueChange={onTenantChange} value={selectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Usuário</FieldLabel>
            <Select onValueChange={onUserChange} value={selectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.user.name} ({user.user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Data Inicial</FieldLabel>
            <Input
              onChange={(e) => onStartDateChange(e.target.value)}
              type="date"
              value={startDate}
            />
          </Field>

          <Field>
            <FieldLabel>Data Final</FieldLabel>
            <Input
              onChange={(e) => onEndDateChange(e.target.value)}
              type="date"
              value={endDate}
            />
          </Field>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onResetFilters} variant="outline">
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
