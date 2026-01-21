"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataCards } from "@/components/lists/data-cards";
import { DataTable } from "@/components/lists/data-table";
import { ResponsiveList } from "@/components/lists/responsive-list";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  _count: {
    users: number;
  };
}

interface TenantsListProps {
  tenants: Tenant[];
  isLoading?: boolean;
  onDelete: (tenant: Tenant) => void;
}

export function TenantsList({
  tenants,
  isLoading = false,
  onDelete,
}: TenantsListProps) {
  const router = useRouter();

  const columns: ColumnDef<Tenant>[] = [
    {
      accessorKey: "name",
      header: "Cliente",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div>
            <Link
              className="font-medium hover:underline"
              href={`/admin/tenants/${tenant.id}` as Route}
            >
              {tenant.name}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const tenant = row.original;
        return tenant.active ? (
          <Badge
            className="text-green-700 ring-1 ring-green-600/20 ring-inset"
            variant="outline"
          >
            Ativo
          </Badge>
        ) : (
          <Badge
            className="text-red-700 ring-1 ring-red-600/20 ring-inset"
            variant="outline"
          >
            Inativo
          </Badge>
        );
      },
    },
    {
      accessorKey: "_count.users",
      header: "Usuários",
      cell: ({ row }) => {
        const count = row.original._count.users;
        return (
          <span className="text-sm">
            {count} usuário{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <PermissionGuard action="UPDATE" resource="TENANT">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button className="h-8 w-8 p-0" variant="ghost" />}
              >
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <PermissionGuard action="READ" resource="TENANT">
                    <DropdownMenuItem
                      onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                    >
                      <MoreHorizontal className="mr-2 h-4 w-4" />
                      Ver/Editar
                    </DropdownMenuItem>
                  </PermissionGuard>
                  <PermissionGuard action="DELETE" resource="TENANT">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(tenant)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Deletar
                    </DropdownMenuItem>
                  </PermissionGuard>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGuard>
        );
      },
    },
  ];

  const renderTable = (data: Tenant[]) => (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhum cliente encontrado."
      onRowClick={(tenant) => router.push(`/admin/tenants/${tenant.id}`)}
    />
  );

  const renderCards = (data: Tenant[]) => (
    <DataCards
      data={data}
      emptyMessage="Nenhum cliente encontrado."
      getHref={(tenant) => `/admin/tenants/${tenant.id}` as Route}
      // onCardClick={(tenant) => router.push(`/admin/tenants/${tenant.id}`)}
      renderCard={(tenant) => (
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-sm leading-tight">
                {tenant.name}
              </div>
              <p className="truncate text-muted-foreground text-xs">
                {tenant.slug}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {tenant.active ? (
                <Badge
                  className="shrink-0 text-green-700 text-xs ring-1 ring-green-600/20 ring-inset"
                  variant="outline"
                >
                  Ativo
                </Badge>
              ) : (
                <Badge
                  className="shrink-0 text-red-700 text-xs ring-1 ring-red-600/20 ring-inset"
                  variant="outline"
                >
                  Inativo
                </Badge>
              )}
              <PermissionGuard action="UPDATE" resource="TENANT">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    render={
                      <Button
                        className="h-6 w-6 shrink-0 p-0"
                        variant="ghost"
                      />
                    }
                  >
                    <span className="sr-only">Abrir menu</span>
                    <MoreHorizontal className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <PermissionGuard action="READ" resource="TENANT">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/tenants/${tenant.id}`);
                          }}
                        >
                          <MoreHorizontal className="mr-2 h-4 w-4" />
                          Ver/Editar
                        </DropdownMenuItem>
                      </PermissionGuard>
                      <PermissionGuard action="DELETE" resource="TENANT">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(tenant);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Deletar
                        </DropdownMenuItem>
                      </PermissionGuard>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGuard>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">
              {tenant._count.users} usuário
              {tenant._count.users !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    />
  );

  return (
    <div className="space-y-4">
      <ResponsiveList
        data={tenants}
        emptyAction={
          <PermissionGuard action="CREATE" resource="TENANT">
            <Button onClick={() => router.push("/admin/tenants/new")}>
              Criar Cliente
            </Button>
          </PermissionGuard>
        }
        emptyDescription="Comece criando seu primeiro cliente."
        emptyIcon={PlusCircle}
        emptyTitle="Nenhum cliente encontrado"
        isLoading={isLoading}
        renderCards={renderCards}
        renderTable={renderTable}
        skeletonColumnCount={columns.length}
      />
    </div>
  );
}
