"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import type { Route } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { trpc, trpcClient } from "@/utils/trpc";
import { InitializePermissionsDialog } from "./_components/initialize-permissions-dialog";
import { PermissionList } from "./_components/permission-list";
import { RoleList } from "./_components/role-list";

type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

function PermissionsPageContent() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [initializeDialogOpen, setInitializeDialogOpen] = useState(false);

  const {
    data: permissions,
    isLoading: permissionsLoading,
    refetch: refetchPermissions,
  } = useQuery({
    ...trpc.permission.listPermissions.queryOptions(),
  });

  const {
    data: rolePermissions,
    isLoading: rolePermissionsLoading,
    refetch: refetchRolePermissions,
  } = useQuery({
    ...trpc.permission.getRolePermissions.queryOptions({
      role: selectedRole ?? "TENANT_USER",
    }),
    enabled: selectedRole !== null,
  });

  const initializePermissionsMutation = useMutation({
    mutationFn: () => trpcClient.permission.initializePermissions.mutate(),
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: (input: {
      role: Role;
      permissions: Array<{ permissionId: string; granted: boolean }>;
    }) => trpcClient.permission.updateRolePermissions.mutate(input),
  });

  const handleInitializePermissions = async () => {
    await initializePermissionsMutation.mutateAsync(undefined, {
      onSuccess: () => {
        toast.success("Permissões inicializadas com sucesso!");
        refetchPermissions();
        if (selectedRole) {
          refetchRolePermissions();
        }
        setInitializeDialogOpen(false);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Erro ao inicializar permissões");
      },
    });
  };

  const handleTogglePermission = async (
    permissionId: string,
    currentlyGranted: boolean
  ) => {
    if (!selectedRole) {
      return;
    }

    const currentPermissions =
      rolePermissions?.map((rp) => ({
        permissionId: rp.permissionId,
        granted: rp.granted,
      })) || [];

    const updatedPermissions = currentPermissions.some(
      (p) => p.permissionId === permissionId
    )
      ? currentPermissions.map((p) =>
          p.permissionId === permissionId
            ? { ...p, granted: !currentlyGranted }
            : p
        )
      : [...currentPermissions, { permissionId, granted: !currentlyGranted }];

    await updateRolePermissionsMutation.mutateAsync(
      {
        role: selectedRole,
        permissions: updatedPermissions,
      },
      {
        onSuccess: () => {
          toast.success("Permissões atualizadas com sucesso!");
          refetchRolePermissions();
        },
        onError: (error: Error) => {
          toast.error(error.message || "Erro ao atualizar permissões");
        },
      }
    );
  };

  const breadcrumbs = [
    { label: "Admin", href: "/admin" as Route },
    { label: "Permissões", isCurrent: true },
  ];

  if (permissionsLoading) {
    return (
      <PageLayout
        breadcrumbs={breadcrumbs}
        subtitle="Configure as permissões de cada role do sistema"
        title="Gerenciar Permissões"
      >
        <div className="grid gap-6 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Selecione uma role</CardDescription>
            </CardHeader>
            <CardContent>
              <ListSkeleton count={4} itemHeight="h-16" />
            </CardContent>
          </Card>
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Permissões</CardTitle>
                <CardDescription>Carregando permissões...</CardDescription>
              </CardHeader>
              <CardContent>
                <ListSkeleton count={5} itemHeight="h-16" />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      actions={
        <Button onClick={() => setInitializeDialogOpen(true)} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Inicializar Permissões
        </Button>
      }
      breadcrumbs={breadcrumbs}
      subtitle="Configure as permissões de cada role do sistema"
      title="Gerenciar Permissões"
    >
      {!permissions || permissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Permissão Encontrada</CardTitle>
            <CardDescription>
              Inicialize as permissões do sistema para começar a configurá-las.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setInitializeDialogOpen(true)}>
              Inicializar Permissões
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-4">
          <RoleList
            onRoleSelect={setSelectedRole}
            selectedRole={selectedRole}
          />

          <div className="lg:col-span-3">
            <PermissionList
              isLoading={rolePermissionsLoading}
              isPending={updateRolePermissionsMutation.isPending}
              onTogglePermission={handleTogglePermission}
              permissions={permissions}
              rolePermissions={rolePermissions}
              selectedRole={selectedRole}
            />
          </div>
        </div>
      )}

      <InitializePermissionsDialog
        isPending={initializePermissionsMutation.isPending}
        onInitialize={handleInitializePermissions}
        onOpenChange={setInitializeDialogOpen}
        open={initializeDialogOpen}
      />
    </PageLayout>
  );
}

export default function PermissionsPage() {
  return (
    <AdminGuard>
      <PermissionsPageContent />
    </AdminGuard>
  );
}
