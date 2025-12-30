"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminGuard } from "@/components/admin";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RoleBadge } from "@/components/role-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

function AdminUsersPageContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const limit = 20;

  // Buscar tenants para o filtro
  const { data: tenantsData } = useQuery({
    ...trpc.admin.listTenants.queryOptions({ page: 1, limit: 100 }),
  });

  // Buscar usuários com filtros
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    ...trpc.admin.listAllUsers.queryOptions({
      page,
      limit,
      search: search || undefined,
      tenantId: selectedTenant !== "all" ? selectedTenant : undefined,
    }),
  });

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;

  const tenants = tenantsData?.data || [];

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Usuários", isCurrent: true },
  ];

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Usuários</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie todos os usuários do sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
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
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
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
              <Select
                onValueChange={(value) => {
                  setSelectedTenant(value || "all");
                  setPage(1);
                }}
                value={selectedTenant}
              >
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
              <Select
                onValueChange={(value) => {
                  setSelectedRole(value || "all");
                  setPage(1);
                }}
                value={selectedRole}
              >
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

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination?.total || 0} usuário{pagination?.total !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton className="h-20 w-full" key={i} />
              ))}
            </div>
          )}
          {!isLoadingUsers && users.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
                <EmptyDescription>
                  {(() => {
                    const hasFilters =
                      search ||
                      selectedTenant !== "all" ||
                      selectedRole !== "all";
                    return hasFilters
                      ? "Tente ajustar os filtros para encontrar usuários."
                      : "Ainda não há usuários cadastrados no sistema.";
                  })()}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {!isLoadingUsers && users.length > 0 && (
            <div className="space-y-4">
              {users
                .filter((user) => {
                  if (!user?.user) {
                    return false;
                  }
                  if (selectedRole === "all") {
                    return true;
                  }
                  return user.role === selectedRole;
                })
                .map((user) => {
                  if (!user?.user) {
                    return null;
                  }
                  return (
                    <div
                      className="flex items-center justify-between rounded-lg border p-4"
                      key={user.id}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                          <Users className="size-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{user.user.name}</p>
                            {user.role && (
                              <RoleBadge
                                role={
                                  user.role as
                                    | "SUPER_ADMIN"
                                    | "TENANT_ADMIN"
                                    | "TENANT_OWNER"
                                    | "TENANT_USER_MANAGER"
                                    | "TENANT_USER"
                                    | null
                                }
                              />
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {user.user.email}
                          </p>
                          {user.tenant && (
                            <div className="mt-1 flex items-center gap-2">
                              <Badge className="text-xs" variant="outline">
                                {user.tenant.name}
                              </Badge>
                              <Link
                                className="text-muted-foreground text-xs underline hover:text-primary"
                                href={`/admin/tenants/${user.tenant.id}`}
                              >
                                Ver tenant
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(user.user.createdAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)}

              {/* Paginação */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <p className="text-muted-foreground text-sm">
                    Página {pagination.page} de {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      disabled={pagination.page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      variant="outline"
                    >
                      Anterior
                    </Button>
                    <Button
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                      variant="outline"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersPageContent />
    </AdminGuard>
  );
}
