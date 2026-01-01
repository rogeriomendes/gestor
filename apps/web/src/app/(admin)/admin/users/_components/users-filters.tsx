"use client";

import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tenant {
  id: string;
  name: string;
}

interface UsersFiltersProps {
  search: string;
  selectedTenant: string;
  selectedRole: string;
  tenants: Tenant[];
  onSearchChange: (value: string) => void;
  onTenantChange: (value: string) => void;
  onRoleChange: (value: string) => void;
}

export function UsersFilters({
  search,
  selectedTenant,
  selectedRole,
  tenants,
  onSearchChange,
  onTenantChange,
  onRoleChange,
}: UsersFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
        <CardDescription>
          Filtre os usuários por nome, email, tenant ou função
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>Buscar</FieldLabel>
            <FieldDescription>
              Busque por nome ou email do usuário
            </FieldDescription>
            <InputGroup>
              <InputGroupInput
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Nome ou email..."
                value={search}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>Tenant</FieldLabel>
            <FieldDescription>Filtre por tenant específico</FieldDescription>
            <Select onValueChange={onTenantChange} value={selectedTenant}>
              <SelectTrigger>
                <SelectValue />
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
            <FieldLabel>Função</FieldLabel>
            <FieldDescription>Filtre por função do usuário</FieldDescription>
            <Select onValueChange={onRoleChange} value={selectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="TENANT_ADMIN">Admin de Tenant</SelectItem>
                <SelectItem value="TENANT_OWNER">Proprietário</SelectItem>
                <SelectItem value="TENANT_USER_MANAGER">
                  Gerente de Usuários
                </SelectItem>
                <SelectItem value="TENANT_USER">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
