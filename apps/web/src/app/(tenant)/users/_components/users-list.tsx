"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  Mail,
  MoreHorizontal,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

interface TenantUser {
  id: string;
  userId: string;
  role: Role | null;
  isPending?: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface UsersListProps {
  users: TenantUser[];
  isLoading: boolean;
  onUpdateRole: (userId: string, role: Role) => void;
  onRemove: (userId: string) => void;
  onResendInvite?: (userId: string) => void;
  onEdit?: (userId: string, name: string, email: string) => void;
}

// Componente para ações da tabela
function UserActionsCell({
  user,
  onEdit,
  onResendInvite,
  onUpdateRole,
  onRemove,
}: {
  user: TenantUser;
  onEdit?: (userId: string, name: string, email: string) => void;
  onResendInvite?: (userId: string) => void;
  onUpdateRole: (userId: string, role: Role) => void;
  onRemove: (userId: string) => void;
}) {
  return (
    <PermissionGuard action="UPDATE" resource="USER">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button className="h-8 w-8 p-0" variant="ghost" />}
        >
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {onEdit && (
              <DropdownMenuItem
                onClick={() =>
                  onEdit(user.userId, user.user.name, user.user.email)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Usuário
              </DropdownMenuItem>
            )}
            {user.isPending && onResendInvite && (
              <DropdownMenuItem onClick={() => onResendInvite(user.userId)}>
                <Mail className="mr-2 h-4 w-4" />
                Reenviar Convite
              </DropdownMenuItem>
            )}
            {(onEdit || (user.isPending && onResendInvite)) && (
              <DropdownMenuSeparator />
            )}
            <PermissionGuard action="UPDATE" resource="USER">
              <DropdownMenuLabel>Alterar Função</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onUpdateRole(user.userId, "TENANT_USER")}
              >
                Usuário
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateRole(user.userId, "TENANT_USER_MANAGER")}
              >
                Gerente de Usuários
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onUpdateRole(user.userId, "TENANT_OWNER")}
              >
                Proprietário
              </DropdownMenuItem>
            </PermissionGuard>
            <PermissionGuard action="DELETE" resource="USER">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onRemove(user.userId)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover do Cliente
              </DropdownMenuItem>
            </PermissionGuard>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </PermissionGuard>
  );
}

// Componente para card de usuário
function UserCard({
  user,
  onEdit,
  onResendInvite,
  onUpdateRole,
  onRemove,
}: {
  user: TenantUser;
  onEdit?: (userId: string, name: string, email: string) => void;
  onResendInvite?: (userId: string) => void;
  onUpdateRole: (userId: string, role: Role) => void;
  onRemove: (userId: string) => void;
}) {
  return (
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
            <RoleBadge role={user.role || "TENANT_USER"} />
          </div>
          <p className="truncate text-muted-foreground text-xs">
            {user.user.email}
          </p>
        </div>
        <PermissionGuard action="UPDATE" resource="USER">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="h-6 w-6 shrink-0 p-0" variant="ghost" />
              }
            >
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() =>
                      onEdit(user.userId, user.user.name, user.user.email)
                    }
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Usuário
                  </DropdownMenuItem>
                )}
                {user.isPending && onResendInvite && (
                  <DropdownMenuItem onClick={() => onResendInvite(user.userId)}>
                    <Mail className="mr-2 h-4 w-4" />
                    Reenviar Convite
                  </DropdownMenuItem>
                )}
                {(onEdit || (user.isPending && onResendInvite)) && (
                  <DropdownMenuSeparator />
                )}
                <PermissionGuard action="UPDATE" resource="USER">
                  <DropdownMenuLabel>Alterar Função</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => onUpdateRole(user.userId, "TENANT_USER")}
                  >
                    Usuário
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      onUpdateRole(user.userId, "TENANT_USER_MANAGER")
                    }
                  >
                    Gerente de Usuários
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onUpdateRole(user.userId, "TENANT_OWNER")}
                  >
                    Proprietário
                  </DropdownMenuItem>
                </PermissionGuard>
                <PermissionGuard action="DELETE" resource="USER">
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onRemove(user.userId)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover do Cliente
                  </DropdownMenuItem>
                </PermissionGuard>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      </div>
    </div>
  );
}

export function UsersList({
  users,
  isLoading,
  onUpdateRole,
  onRemove,
  onResendInvite,
  onEdit,
}: UsersListProps) {
  const columns: ColumnDef<TenantUser>[] = [
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
                {user.role && <RoleBadge role={user.role} />}
              </div>
              <p className="text-muted-foreground text-sm">{user.user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Função",
      cell: ({ row }) => {
        const role = row.original.role;
        return role ? (
          <RoleBadge role={role} />
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <UserActionsCell
            onEdit={onEdit}
            onRemove={onRemove}
            onResendInvite={onResendInvite}
            onUpdateRole={onUpdateRole}
            user={user}
          />
        );
      },
    },
  ];

  const renderTable = (data: TenantUser[]) => (
    <DataTable<TenantUser> columns={columns} data={data} />
  );

  const renderCards = (data: TenantUser[]) => (
    <DataCards<TenantUser>
      data={data}
      emptyMessage="Nenhum usuário encontrado."
      renderCard={(user) => (
        <UserCard
          onEdit={onEdit}
          onRemove={onRemove}
          onResendInvite={onResendInvite}
          onUpdateRole={onUpdateRole}
          user={user}
        />
      )}
    />
  );

  return (
    <ResponsiveList<TenantUser>
      data={users}
      emptyDescription="Convide usuários para começar a trabalhar em equipe."
      emptyIcon={UserPlus}
      emptyTitle="Nenhum usuário encontrado"
      isLoading={isLoading}
      renderCards={renderCards}
      renderTable={renderTable}
      skeletonColumnCount={columns.length}
    />
  );
}
