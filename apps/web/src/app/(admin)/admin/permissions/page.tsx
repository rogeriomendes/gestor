"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { trpc, trpcClient } from "@/utils/trpc";

type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Admin de Tenant",
  TENANT_OWNER: "Proprietário",
  TENANT_USER_MANAGER: "Gerente de Usuários",
  TENANT_USER: "Usuário",
};

const RESOURCE_LABELS: Record<string, string> = {
  TENANT: "Tenants",
  USER: "Usuários",
  BRANCH: "Filiais",
  SETTINGS: "Configurações",
  DASHBOARD: "Dashboard",
  AUDIT_LOG: "Logs de Auditoria",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Criar",
  READ: "Visualizar",
  UPDATE: "Editar",
  DELETE: "Deletar",
  MANAGE: "Gerenciar (Tudo)",
};

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
      role: selectedRole!,
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
    await initializePermissionsMutation.mutateAsync(
      {},
      {
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
      }
    );
  };

  const handleTogglePermission = async (
    permissionId: string,
    currentlyGranted: boolean
  ) => {
    if (!selectedRole) return;

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

  if (permissionsLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
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
      {} as Record<string, typeof permissions>
    ) || {};

  const rolePermissionsMap = new Map(
    rolePermissions?.map((rp) => [rp.permissionId, rp.granted]) || []
  );

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Permissões", isCurrent: true },
  ];

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Gerenciar Permissões</h2>
          <p className="text-muted-foreground text-sm">
            Configure as permissões de cada role do sistema
          </p>
        </div>
        <Button onClick={() => setInitializeDialogOpen(true)} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Inicializar Permissões
        </Button>
      </div>

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
          {/* Lista de Roles */}
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Selecione uma role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(
                [
                  "TENANT_ADMIN",
                  "TENANT_OWNER",
                  "TENANT_USER_MANAGER",
                  "TENANT_USER",
                ] as Role[]
              ).map((role) => (
                <button
                  className={`w-full rounded-md border p-3 text-left transition-colors ${
                    selectedRole === role
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  }`}
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  type="button"
                >
                  <div className="font-medium">{ROLE_LABELS[role]}</div>
                  <div className="text-muted-foreground text-xs">{role}</div>
                </button>
              ))}
              <div className="rounded-md border border-dashed p-3">
                <div className="font-medium text-muted-foreground">
                  {ROLE_LABELS.SUPER_ADMIN}
                </div>
                <div className="text-muted-foreground text-xs">
                  Tem todas as permissões
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissões da Role Selecionada */}
          <div className="lg:col-span-3">
            {selectedRole ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Permissões - {ROLE_LABELS[selectedRole]}
                  </CardTitle>
                  <CardDescription>
                    Gerencie as permissões desta role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rolePermissionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(permissionsByResource).map(
                        ([resource, resourcePermissions]) => (
                          <div key={resource}>
                            <h3 className="mb-3 font-semibold">
                              {RESOURCE_LABELS[resource] || resource}
                            </h3>
                            <div className="space-y-2">
                              {resourcePermissions.map((permission) => {
                                const isGranted =
                                  rolePermissionsMap.get(permission.id) ??
                                  false;
                                return (
                                  <div
                                    className="flex items-center justify-between rounded-md border p-3"
                                    key={permission.id}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {ACTION_LABELS[permission.action] ||
                                          permission.action}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        {permission.name}
                                      </div>
                                    </div>
                                    <button
                                      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                                        isGranted
                                          ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                          : "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"
                                      }`}
                                      disabled={
                                        updateRolePermissionsMutation.isPending
                                      }
                                      onClick={() =>
                                        handleTogglePermission(
                                          permission.id,
                                          isGranted
                                        )
                                      }
                                      type="button"
                                    >
                                      {isGranted ? (
                                        <>
                                          <CheckCircle2 className="h-4 w-4" />
                                          Permitido
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-4 w-4" />
                                          Negado
                                        </>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Selecione uma Role</CardTitle>
                  <CardDescription>
                    Escolha uma role à esquerda para visualizar e editar suas
                    permissões
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CheckCircle2 className="h-6 w-6" />
                      </EmptyMedia>
                      <EmptyTitle>Nenhuma role selecionada</EmptyTitle>
                      <EmptyDescription>
                        Selecione uma role na lista ao lado para começar
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Dialog de Inicialização */}
      <Dialog
        onOpenChange={setInitializeDialogOpen}
        open={initializeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inicializar Permissões</DialogTitle>
            <DialogDescription>
              Isso irá criar todas as permissões padrão do sistema e atribuí-las
              às roles. As permissões existentes serão atualizadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={initializePermissionsMutation.isPending}
              onClick={() => setInitializeDialogOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={initializePermissionsMutation.isPending}
              onClick={handleInitializePermissions}
            >
              {initializePermissionsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inicializando...
                </>
              ) : (
                "Inicializar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PermissionsPage() {
  return (
    <AdminGuard>
      <PermissionsPageContent />
    </AdminGuard>
  );
}
