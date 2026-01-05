"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import type { Route } from "next";
import { useEffect, useState } from "react";
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

  // Sincronizar permissões quando MANAGE estiver marcado
  useEffect(() => {
    if (
      !(selectedRole && permissions && rolePermissions) ||
      rolePermissionsLoading ||
      updateRolePermissionsMutation.isPending
    ) {
      return;
    }

    // Agrupar permissões por recurso
    const permissionsByResource = permissions.reduce(
      (acc, perm) => {
        const resource = perm.resource;
        if (!acc[resource]) {
          acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
      },
      {} as Record<string, typeof permissions>
    );

    const currentPermissionsMap = new Map(
      rolePermissions.map((rp) => [rp.permissionId, rp.granted])
    );

    let needsUpdate = false;
    const updatedPermissionsMap = new Map(currentPermissionsMap);

    // Para cada recurso, verificar se MANAGE está marcado
    for (const [, resourcePermissions] of Object.entries(
      permissionsByResource
    )) {
      const managePermission = resourcePermissions.find(
        (p) => p.action === "MANAGE"
      );

      if (!managePermission) {
        continue;
      }

      const isManageGranted =
        currentPermissionsMap.get(managePermission.id) ?? false;

      // Se MANAGE está marcado, garantir que todas as outras também estão
      if (isManageGranted) {
        for (const perm of resourcePermissions) {
          const isCurrentlyGranted =
            currentPermissionsMap.get(perm.id) ?? false;
          if (!isCurrentlyGranted) {
            updatedPermissionsMap.set(perm.id, true);
            needsUpdate = true;
          }
        }
      }
    }

    // Se precisa atualizar, fazer a sincronização
    if (needsUpdate) {
      const updatedPermissions = Array.from(
        updatedPermissionsMap.entries()
      ).map(([id, granted]) => ({
        permissionId: id,
        granted,
      }));

      updateRolePermissionsMutation.mutate(
        {
          role: selectedRole,
          permissions: updatedPermissions,
        },
        {
          onSuccess: () => {
            refetchRolePermissions();
          },
          onError: (error: Error) => {
            console.error("Erro ao sincronizar permissões:", error);
          },
        }
      );
    }
  }, [
    selectedRole,
    permissions,
    rolePermissions,
    rolePermissionsLoading,
    updateRolePermissionsMutation.isPending,
    updateRolePermissionsMutation,
    refetchRolePermissions,
  ]);

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
    if (!(selectedRole && permissions)) {
      return;
    }

    // Encontrar a permissão que está sendo alterada
    const toggledPermission = permissions.find((p) => p.id === permissionId);
    if (!toggledPermission) {
      return;
    }

    const currentPermissions =
      rolePermissions?.map((rp) => ({
        permissionId: rp.permissionId,
        granted: rp.granted,
      })) || [];

    const newGrantedValue = !currentlyGranted;

    // Se está marcando MANAGE, marcar todas as outras permissões do mesmo recurso
    if (toggledPermission.action === "MANAGE" && newGrantedValue) {
      const resourcePermissions = permissions.filter(
        (p) => p.resource === toggledPermission.resource
      );

      const updatedPermissionsMap = new Map(
        currentPermissions.map((p) => [p.permissionId, p.granted])
      );

      // Marcar todas as permissões do recurso
      resourcePermissions.forEach((perm) => {
        updatedPermissionsMap.set(perm.id, true);
      });

      const updatedPermissions = Array.from(
        updatedPermissionsMap.entries()
      ).map(([id, granted]) => ({
        permissionId: id,
        granted,
      }));

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
      return;
    }

    // Se está desmarcando qualquer permissão (exceto MANAGE), desmarcar MANAGE também
    if (toggledPermission.action !== "MANAGE" && !newGrantedValue) {
      const resourcePermissions = permissions.filter(
        (p) => p.resource === toggledPermission.resource
      );
      const managePermission = resourcePermissions.find(
        (p) => p.action === "MANAGE"
      );

      const updatedPermissionsMap = new Map(
        currentPermissions.map((p) => [p.permissionId, p.granted])
      );

      // Desmarcar a permissão clicada
      updatedPermissionsMap.set(permissionId, false);

      // Desmarcar MANAGE se existir
      if (managePermission) {
        updatedPermissionsMap.set(managePermission.id, false);
      }

      const updatedPermissions = Array.from(
        updatedPermissionsMap.entries()
      ).map(([id, granted]) => ({
        permissionId: id,
        granted,
      }));

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
      return;
    }

    // Se está marcando uma permissão individual, verificar se todas estão marcadas para marcar MANAGE
    if (toggledPermission.action !== "MANAGE" && newGrantedValue) {
      const resourcePermissions = permissions.filter(
        (p) => p.resource === toggledPermission.resource
      );
      const managePermission = resourcePermissions.find(
        (p) => p.action === "MANAGE"
      );
      const otherPermissions = resourcePermissions.filter(
        (p) => p.action !== "MANAGE"
      );

      const updatedPermissionsMap = new Map(
        currentPermissions.map((p) => [p.permissionId, p.granted])
      );

      // Marcar a permissão clicada
      updatedPermissionsMap.set(permissionId, true);

      // Verificar se todas as outras permissões (exceto MANAGE) estão marcadas
      const allOthersGranted = otherPermissions.every((perm) => {
        if (perm.id === permissionId) {
          return true; // A que acabou de ser marcada
        }
        return updatedPermissionsMap.get(perm.id) ?? false;
      });

      // Se todas estão marcadas, marcar MANAGE também
      if (allOthersGranted && managePermission) {
        updatedPermissionsMap.set(managePermission.id, true);
      }

      const updatedPermissions = Array.from(
        updatedPermissionsMap.entries()
      ).map(([id, granted]) => ({
        permissionId: id,
        granted,
      }));

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
      return;
    }

    // Caso padrão: apenas alternar a permissão
    const updatedPermissions = currentPermissions.some(
      (p) => p.permissionId === permissionId
    )
      ? currentPermissions.map((p) =>
          p.permissionId === permissionId
            ? { ...p, granted: newGrantedValue }
            : p
        )
      : [...currentPermissions, { permissionId, granted: newGrantedValue }];

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
    { label: "Dashboard", href: "/admin" as Route },
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
