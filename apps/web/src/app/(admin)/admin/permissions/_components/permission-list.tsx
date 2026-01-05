"use client";

import { Loader2 } from "lucide-react";
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
import { getPermissionResourceLabel } from "@/lib/permission-labels";
import { ROLE_LABELS } from "@/lib/role-labels";
import { PermissionItem } from "./permission-item";

type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
}

interface RolePermission {
  permissionId: string;
  granted: boolean;
}

interface PermissionListProps {
  selectedRole: Role | null;
  permissions: Permission[] | undefined;
  rolePermissions: RolePermission[] | undefined;
  isLoading: boolean;
  isPending: boolean;
  onTogglePermission: (permissionId: string, currentlyGranted: boolean) => void;
}

export function PermissionList({
  selectedRole,
  permissions,
  rolePermissions,
  isLoading,
  isPending,
  onTogglePermission,
}: PermissionListProps) {
  if (!selectedRole) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selecione uma Role</CardTitle>
          <CardDescription>
            Escolha uma role à esquerda para visualizar e editar suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Loader2 className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma role selecionada</EmptyTitle>
              <EmptyDescription>
                Selecione uma role na lista ao lado para começar
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permissões - {ROLE_LABELS[selectedRole]}</CardTitle>
          <CardDescription>Gerencie as permissões desta role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const permissionsByResource =
    permissions?.reduce(
      (acc, perm) => {
        const resource = perm.resource;
        if (!acc[resource]) {
          acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
      },
      {} as Record<string, Permission[]>
    ) || {};

  const rolePermissionsMap = new Map(
    rolePermissions?.map((rp) => [rp.permissionId, rp.granted]) || []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissões - {ROLE_LABELS[selectedRole]}</CardTitle>
        <CardDescription>Gerencie as permissões desta role</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(permissionsByResource).map(
            ([resource, resourcePermissions]) => {
              return (
                <div key={resource}>
                  <h3 className="mb-3 font-semibold">
                    {getPermissionResourceLabel(resource)}
                  </h3>
                  <div className="space-y-2">
                    {resourcePermissions.map((permission) => {
                      const isGranted =
                        rolePermissionsMap.get(permission.id) ?? false;
                      return (
                        <PermissionItem
                          action={permission.action}
                          isGranted={isGranted}
                          isPending={isPending}
                          key={permission.id}
                          name={permission.name}
                          onToggle={onTogglePermission}
                          permissionId={permission.id}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </CardContent>
    </Card>
  );
}
