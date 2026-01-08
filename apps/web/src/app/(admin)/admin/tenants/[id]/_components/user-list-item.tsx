"use client";

import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { RoleBadge } from "@/components/role-badge";
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

interface UserListItemProps {
  userId: string;
  name: string;
  email: string;
  role: Role;
  onUpdateRole: (userId: string, role: Role) => void;
  onRemove: (userId: string) => void;
  onEdit?: (userId: string, name: string, email: string) => void;
}

export function UserListItem({
  userId,
  name,
  email,
  role,
  onUpdateRole,
  onRemove,
  onEdit,
}: UserListItemProps) {
  return (
    <div className="flex items-center justify-between rounded border p-4">
      <div className="flex items-center space-x-4">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-muted-foreground text-sm">{email}</p>
        </div>
        <RoleBadge role={role} />
      </div>
      <PermissionGuard action="UPDATE" resource="USER">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button className="h-8 w-8 p-0" variant="ghost" />}
          >
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <PermissionGuard action="UPDATE" resource="USER">
                {onEdit && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onEdit(userId, name, email)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Usuário
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
              </PermissionGuard>
              <PermissionGuard action="UPDATE" resource="USER">
                <DropdownMenuLabel>Alterar Função</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(userId, "TENANT_USER")}
                >
                  Usuário
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(userId, "TENANT_USER_MANAGER")}
                >
                  Gerente de Usuários
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(userId, "TENANT_OWNER")}
                >
                  Proprietário
                </DropdownMenuItem>
              </PermissionGuard>
              <PermissionGuard action="DELETE" resource="USER">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onRemove(userId)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remover do Tenant
                </DropdownMenuItem>
              </PermissionGuard>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </PermissionGuard>
    </div>
  );
}
