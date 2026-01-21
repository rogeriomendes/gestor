/* eslint-disable unicorn/consistent-function-scoping */
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { DataCards } from "@/components/lists/data-cards";
import { DataTable } from "@/components/lists/data-table";
import { ResponsiveList } from "@/components/lists/responsive-list";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { RoleBadge } from "@/components/role-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditUserDialog } from "../../../users/_components/edit-user-dialog";
import { AddUserDialog } from "./add-user-dialog";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AvailableUser {
  id: string;
  user: {
    name: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
  } | null;
}

interface TenantUsersTabProps {
  tenantId: string;
  users: User[];
  isLoading: boolean;
  availableUsers: AvailableUser[];
  availableUsersLoading: boolean;
  onUpdateRole: (userId: string, role: Role) => void;
  onRemove: (userId: string) => void;
  onRefresh: () => void;
}

export function TenantUsersTab({
  tenantId,
  users,
  isLoading,
  availableUsers,
  availableUsersLoading,
  onUpdateRole,
  onRemove,
  onRefresh,
}: TenantUsersTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const handleEdit = (userId: string, name: string, email: string) => {
    setEditingUser({ id: userId, name, email });
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{row.original.name}</span>
          <span className="text-muted-foreground text-xs">
            {row.original.email}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Função",
      cell: ({ row }) => (
        <RoleBadge
          role={
            row.original.role as
              | "TENANT_OWNER"
              | "TENANT_USER_MANAGER"
              | "TENANT_USER"
              | null
          }
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <PermissionGuard action="UPDATE" resource="USER">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button className="h-8 w-8 p-0" variant="ghost" />}
              >
                <span className="sr-only">Abrir menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <PermissionGuard action="UPDATE" resource="USER">
                    <DropdownMenuItem
                      onClick={() => handleEdit(user.id, user.name, user.email)}
                    >
                      Editar Usuário
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Alterar Função</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onUpdateRole(user.id, "TENANT_USER")}
                    >
                      Usuário
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onUpdateRole(user.id, "TENANT_USER_MANAGER")
                      }
                    >
                      Gerente de Usuários
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateRole(user.id, "TENANT_OWNER")}
                    >
                      Proprietário
                    </DropdownMenuItem>
                  </PermissionGuard>
                  <PermissionGuard action="DELETE" resource="USER">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onRemove(user.id)}
                    >
                      Remover do Cliente
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

  const renderTable = (data: User[]) => (
    <DataTable<User> columns={columns} data={data} />
  );

  const renderCards = (data: User[]) => (
    <DataCards<User>
      data={data}
      emptyMessage="Nenhum usuário encontrado para este cliente."
      renderCard={(user) => (
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-sm leading-tight">
                  {user.name}
                </span>
                <RoleBadge
                  role={
                    user.role as
                      | "TENANT_OWNER"
                      | "TENANT_USER_MANAGER"
                      | "TENANT_USER"
                      | null
                  }
                />
              </div>
              <p className="truncate text-muted-foreground text-xs">
                {user.email}
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
                  <UserPlus className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => handleEdit(user.id, user.name, user.email)}
                    >
                      Editar Usuário
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Alterar Função</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onUpdateRole(user.id, "TENANT_USER")}
                    >
                      Usuário
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onUpdateRole(user.id, "TENANT_USER_MANAGER")
                      }
                    >
                      Gerente de Usuários
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateRole(user.id, "TENANT_OWNER")}
                    >
                      Proprietário
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onRemove(user.id)}
                    >
                      Remover do Cliente
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </PermissionGuard>
          </div>
        </div>
      )}
    />
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Gerencie os usuários associados a este cliente
              </CardDescription>
            </div>
            <PermissionGuard action="CREATE" resource="USER">
              <Button onClick={() => setIsDialogOpen(true)}>
                <UserPlus className="mr-2 size-4" /> Adicionar Usuário
              </Button>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveList<User>
            data={users}
            emptyDescription="Nenhum usuário foi associado a este cliente ainda. Adicione usuários para começar."
            emptyTitle="Nenhum usuário encontrado para este cliente"
            isLoading={isLoading}
            renderCards={renderCards}
            renderTable={renderTable}
            skeletonColumnCount={3}
          />
        </CardContent>
      </Card>

      <AddUserDialog
        availableUsers={availableUsers}
        isLoading={availableUsersLoading}
        onOpenChange={setIsDialogOpen}
        onSuccess={onRefresh}
        open={isDialogOpen}
        tenantId={tenantId}
      />

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          onOpenChange={(open: boolean) => !open && setEditingUser(null)}
          onSuccess={() => {
            onRefresh();
            setEditingUser(null);
          }}
          open={!!editingUser}
          userEmail={editingUser.email}
          userId={editingUser.id}
          userName={editingUser.name}
        />
      )}
    </div>
  );
}
