"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, RotateCcw, TrashIcon } from "lucide-react";
import { DataCards } from "@/components/lists/data-cards";
import { DataTable } from "@/components/lists/data-table";
import { ResponsiveList } from "@/components/lists/responsive-list";
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

interface DeletedTenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  deletedAt: Date | string | null;
  deletedByUser: {
    name: string | null;
    email: string;
  } | null;
  _count: {
    users: number;
  };
}

interface DeletedTenantsListProps {
  tenants: DeletedTenant[];
  isLoading: boolean;
  onRestore: (tenant: DeletedTenant) => void;
  onPermanentDelete: (tenant: DeletedTenant) => void;
}

export function DeletedTenantsList({
  tenants,
  isLoading,
  onRestore,
  onPermanentDelete,
}: DeletedTenantsListProps) {
  const columns: ColumnDef<DeletedTenant>[] = [
    {
      accessorKey: "name",
      header: "Cliente",
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div>
            <div className="font-medium">{tenant.name}</div>
            <p className="text-muted-foreground text-sm">{tenant.slug}</p>
            {tenant.deletedAt && (
              <p className="mt-1 text-muted-foreground text-xs">
                Deletado em:{" "}
                {new Date(tenant.deletedAt).toLocaleString("pt-BR")}
                {tenant.deletedByUser &&
                  ` por ${tenant.deletedByUser.name || tenant.deletedByUser.email}`}
              </p>
            )}
          </div>
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
                <DropdownMenuItem onClick={() => onRestore(tenant)}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onPermanentDelete(tenant)}
                >
                  <TrashIcon className="mr-2 h-4 w-4" /> Excluir Permanentemente
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const renderTable = (data: DeletedTenant[]) => (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhum cliente deletado encontrado."
    />
  );

  const renderCards = (data: DeletedTenant[]) => (
    <DataCards
      data={data}
      emptyMessage="Nenhum cliente deletado encontrado."
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
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                render={
                  <Button className="h-6 w-6 shrink-0 p-0" variant="ghost" />
                }
              >
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(tenant);
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPermanentDelete(tenant);
                    }}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" /> Excluir
                    Permanentemente
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {tenant.deletedAt && (
              <span className="text-muted-foreground">
                Deletado em:{" "}
                {new Date(tenant.deletedAt).toLocaleString("pt-BR")}
                {tenant.deletedByUser &&
                  ` por ${tenant.deletedByUser.name || tenant.deletedByUser.email}`}
              </span>
            )}
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
        emptyDescription="Não há clientes deletados no momento."
        emptyIcon={TrashIcon}
        emptyTitle="Nenhum cliente deletado"
        isLoading={isLoading}
        renderCards={renderCards}
        renderTable={renderTable}
        skeletonColumnCount={columns.length}
      />
    </div>
  );
}
