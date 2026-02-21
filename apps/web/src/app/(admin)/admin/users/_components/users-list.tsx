"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  Mail,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { DataCards } from "@/components/lists/data-cards";
import { DataTable } from "@/components/lists/data-table";
import { ResponsiveList } from "@/components/lists/responsive-list";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { RoleBadge } from "@/components/role-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  isPending?: boolean;
  role: string | null;
  tenant: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
}

interface UsersListProps {
  isLoading: boolean;
  onDelete?: (userId: string) => void;
  onEdit: (
    userId: string,
    userName: string,
    userEmail: string,
    tenantId?: string | null,
    role?: string | null
  ) => void;
  onPageChange: (page: number) => void;
  onResendInvite?: (userId: string) => void;
  onRestore?: (userId: string) => void;
  pagination:
    | {
        page: number;
        totalPages: number;
        total: number;
      }
    | undefined;
  selectedRole: string;
  users: User[];
}

export function UsersList({
  users,
  isLoading,
  pagination,
  selectedRole,
  onPageChange,
  onEdit,
  onDelete,
  onRestore,
  onResendInvite,
}: UsersListProps) {
  const filteredUsers = users.filter((user) => {
    if (!user?.user) {
      return false;
    }
    if (selectedRole === "all") {
      return true;
    }
    return user.role === selectedRole;
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "user.name",
      header: "Usuário",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{user.user.name}</span>
                {user.isPending && (
                  <Badge
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    variant="secondary"
                  >
                    Pendente
                  </Badge>
                )}
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
              <p className="text-muted-foreground text-sm">{user.user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "tenant",
      header: "Cliente",
      cell: ({ row }) => {
        const tenant = row.original.tenant;
        return (
          <div className="text-sm">
            {tenant ? (
              <div className="space-y-1">
                <Badge variant="outline">{tenant.name}</Badge>
                <div>
                  <Link
                    className="text-muted-foreground text-xs underline hover:text-primary"
                    href={`/admin/tenants/${tenant.id}`}
                  >
                    Ver cliente
                  </Link>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "user.createdAt",
      header: "Data de Criação",
      cell: ({ row }) => {
        return (
          <span className="text-sm">
            {new Date(row.original.user.createdAt).toLocaleDateString("pt-BR")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <PermissionGuard action="UPDATE" resource="USER">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button className="h-8 w-8 p-0" variant="ghost" />}
              >
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <PermissionGuard action="UPDATE" resource="USER">
                  <DropdownMenuItem
                    onClick={() =>
                      onEdit(
                        user.user.id,
                        user.user.name,
                        user.user.email,
                        user.tenant?.id || null,
                        user.role || null
                      )
                    }
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Usuário
                  </DropdownMenuItem>
                </PermissionGuard>
                {user.isPending && onResendInvite && (
                  <PermissionGuard action="UPDATE" resource="USER">
                    <DropdownMenuItem
                      onClick={() => onResendInvite(user.user.id)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Reenviar Convite
                    </DropdownMenuItem>
                  </PermissionGuard>
                )}
                <PermissionGuard action="DELETE" resource="USER">
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(user.user.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar Usuário
                    </DropdownMenuItem>
                  )}
                </PermissionGuard>
                {onRestore && (
                  <PermissionGuard action="UPDATE" resource="USER">
                    <DropdownMenuItem onClick={() => onRestore(user.user.id)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restaurar Usuário
                    </DropdownMenuItem>
                  </PermissionGuard>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGuard>
        );
      },
    },
  ];

  const renderTable = (data: User[]) => (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhum usuário encontrado."
      onRowClick={(user) => {
        onEdit(
          user.user.id,
          user.user.name,
          user.user.email,
          user.tenant?.id || null,
          user.role || null
        );
      }}
    />
  );

  const renderCards = (data: User[]) => (
    <DataCards
      data={data}
      emptyMessage="Nenhum usuário encontrado."
      onCardClick={(user) => {
        onEdit(
          user.user.id,
          user.user.name,
          user.user.email,
          user.tenant?.id || null,
          user.role || null
        );
      }}
      renderCard={(user) => (
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-sm leading-tight">
                  {user.user.name}
                </span>
                {user.isPending && (
                  <Badge
                    className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    variant="secondary"
                  >
                    Pendente
                  </Badge>
                )}
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
              <p className="truncate text-muted-foreground text-xs">
                {user.user.email}
              </p>
            </div>
            <PermissionGuard action="UPDATE" resource="USER">
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
                  <PermissionGuard action="UPDATE" resource="USER">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(
                          user.user.id,
                          user.user.name,
                          user.user.email,
                          user.tenant?.id || null,
                          user.role || null
                        );
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Usuário
                    </DropdownMenuItem>
                  </PermissionGuard>
                  {user.isPending && onResendInvite && (
                    <PermissionGuard action="UPDATE" resource="USER">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onResendInvite(user.user.id);
                        }}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Reenviar Convite
                      </DropdownMenuItem>
                    </PermissionGuard>
                  )}
                  <PermissionGuard action="DELETE" resource="USER">
                    {onDelete && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(user.user.id);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar Usuário
                      </DropdownMenuItem>
                    )}
                  </PermissionGuard>
                  {onRestore && (
                    <PermissionGuard action="UPDATE" resource="USER">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore(user.user.id);
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restaurar Usuário
                      </DropdownMenuItem>
                    </PermissionGuard>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionGuard>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {user.tenant && (
              <>
                <Badge className="text-xs" variant="outline">
                  {user.tenant.name}
                </Badge>
                <Link
                  className="text-muted-foreground underline hover:text-primary"
                  href={`/admin/tenants/${user.tenant.id}`}
                >
                  Ver cliente
                </Link>
              </>
            )}
            <span className="text-muted-foreground">
              {new Date(user.user.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      )}
    />
  );

  return (
    <div className="space-y-4">
      <ResponsiveList
        data={filteredUsers}
        emptyDescription={
          selectedRole !== "all"
            ? "Tente ajustar os filtros para encontrar usuários."
            : "Ainda não há usuários cadastrados no sistema."
        }
        emptyIcon={Users}
        emptyTitle="Nenhum usuário encontrado"
        isLoading={isLoading}
        renderCards={renderCards}
        renderTable={renderTable}
        skeletonColumnCount={columns.length}
      />

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-muted-foreground text-sm">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={pagination.page === 1}
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              variant="outline"
            >
              Anterior
            </Button>
            <Button
              disabled={pagination.page === pagination.totalPages}
              onClick={() =>
                onPageChange(
                  Math.min(pagination.totalPages, pagination.page + 1)
                )
              }
              variant="outline"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
