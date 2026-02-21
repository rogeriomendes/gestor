"use client";

import { Edit, Mail, MoreHorizontal, Trash2 } from "lucide-react";
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

interface UserListItemProps {
  email: string;
  isPending?: boolean;
  name: string;
  onEdit?: (userId: string, name: string, email: string) => void;
  onRemove: (userId: string) => void;
  onResendInvite?: (userId: string) => void;
  onUpdateRole: (userId: string, role: Role) => void;
  role: Role;
  userId: string;
}

export function UserListItem({
  userId,
  name,
  email,
  role,
  isPending,
  onUpdateRole,
  onRemove,
  onResendInvite,
  onEdit,
}: UserListItemProps) {
  return (
    <div className="flex items-center justify-between rounded border p-4">
      <div className="flex items-center space-x-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{name}</p>
            {isPending && (
              <Badge
                className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                variant="secondary"
              >
                Pendente
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{email}</p>
        </div>
        {role && <RoleBadge role={role} />}
      </div>
      <PermissionGuard action="UPDATE" resource="USER">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button className="h-8 w-8 p-0" variant="ghost" />}
          >
            <span className="sr-only">Open menu</span>
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
                    {isPending && onResendInvite && (
                      <DropdownMenuItem onClick={() => onResendInvite(userId)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Reenviar Convite
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}
              </PermissionGuard>
              <PermissionGuard action="UPDATE" resource="USER">
                <DropdownMenuLabel>Alterar Role</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(userId, "TENANT_USER")}
                >
                  User
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(userId, "TENANT_USER_MANAGER")}
                >
                  User Manager
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(userId, "TENANT_OWNER")}
                >
                  Owner
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
