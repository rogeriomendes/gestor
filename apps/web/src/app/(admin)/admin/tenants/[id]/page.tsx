"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import type { Route } from "next";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc, trpcClient } from "@/utils/trpc";
import { TenantBranchesTab } from "./_components/tenant-branches-tab";
import { TenantDatabaseTab } from "./_components/tenant-database-tab";
import { TenantDetailsForm } from "./_components/tenant-details-form";
import { TenantSubscriptionTab } from "./_components/tenant-subscription-tab";
import { TenantUsersTab } from "./_components/tenant-users-tab";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

interface TenantPageContentProps {
  tenantId: string;
}

function TenantPageContent({ tenantId }: TenantPageContentProps) {
  const {
    data: tenant,
    isLoading: tenantLoading,
    isError: tenantError,
    error: tenantErrorData,
    refetch: refetchTenant,
  } = useQuery({
    ...trpc.admin.getTenant.queryOptions({ tenantId }),
    enabled: !!tenantId,
  });
  const {
    data: tenantUsers,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    ...trpc.admin.listTenantUsers.queryOptions({
      tenantId,
      page: 1,
      limit: 100,
    }),
    enabled: !!tenantId, // Carregar sempre que tiver tenantId, não apenas quando a aba está ativa
  });

  const { data: allUsers, isLoading: allUsersLoading } = useQuery({
    ...trpc.admin.listAllUsers.queryOptions({
      page: 1,
      limit: 100,
    }),
    enabled: true,
  });

  const removeUserMutation = useMutation({
    mutationFn: (input: { tenantId: string; userId: string }) =>
      trpcClient.admin.removeUserFromTenant.mutate(input),
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: (input: { tenantId: string; userId: string; role: Role }) =>
      trpcClient.admin.updateUserRoleInTenant.mutate(input),
  });

  const resendInviteMutation = useMutation({
    mutationFn: (userId: string) =>
      trpcClient.admin.resendInvite.mutate({ userId }),
  });

  const handleResendInvite = async (userId: string) => {
    try {
      await resendInviteMutation.mutateAsync(userId);
      toast.success("Convite reenviado com sucesso!");
      refetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao reenviar convite"
      );
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUserMutation.mutateAsync({ tenantId, userId });
      toast.success("Usuário removido do cliente com sucesso!");
      refetchUsers();
      refetchTenant();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao remover usuário"
      );
    }
  };

  const handleUpdateUserRole = async (userId: string, role: Role) => {
    try {
      await updateUserRoleMutation.mutateAsync({
        tenantId,
        userId,
        role,
      });
      toast.success("Função do usuário atualizada com sucesso!");
      refetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao atualizar função"
      );
    }
  };

  const handleRefresh = () => {
    refetchUsers();
    refetchTenant();
  };

  // Mostrar skeleton enquanto carrega
  if (tenantLoading) {
    const breadcrumbs = [
      { label: "Dashboard", href: "/admin" as Route },
      { label: "Clientes", href: "/admin/tenants" as Route },
      { label: "Carregando...", isCurrent: true },
    ];

    return (
      <PageLayout
        breadcrumbs={breadcrumbs}
        showBackButton
        subtitle="Carregando..."
        title="Carregando..."
      >
        <Tabs defaultValue="details">
          <TabsList variant="line">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="branches">Filiais</TabsTrigger>
            <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6" value="details">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PageLayout>
    );
  }

  // Mostrar erro se tenant não existe ou houve erro
  if (tenantError || !tenant) {
    const breadcrumbs = [
      { label: "Dashboard", href: "/admin" as Route },
      { label: "Clientes", href: "/admin/tenants" as Route },
      { label: "Erro", isCurrent: true },
    ];

    const errorMessage =
      tenantErrorData?.message ||
      "Cliente não encontrado ou você não tem permissão para acessá-lo.";

    return (
      <PageLayout
        breadcrumbs={breadcrumbs}
        showBackButton
        subtitle="Erro"
        title="Cliente não encontrado"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar cliente</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => refetchTenant()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </PageLayout>
    );
  }

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Clientes", href: "/admin/tenants" as Route },
    { label: tenant.name, isCurrent: true },
  ];

  // Filtrar usuários que não estão no cliente
  const availableUsers =
    allUsers?.data.filter(
      (user) => !user.tenant || user.tenant?.id !== tenantId
    ) || [];

  const usersList =
    tenantUsers?.data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      isPending: user.isPending,
    })) || [];

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      showBackButton
      subtitle={`${tenant.slug} ${tenant.active ? "• Ativo" : "• Inativo"}`}
      title={tenant.name}
    >
      <Tabs defaultValue="details">
        <TabsList variant="line">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          <TabsTrigger value="users">
            Usuários ({tenantUsers?.data.length || 0})
          </TabsTrigger>
          <TabsTrigger value="branches">
            Filiais ({tenant.branches?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="details">
          <TenantDetailsForm onSuccess={refetchTenant} tenant={tenant} />
        </TabsContent>
        <TabsContent value="database">
          <TenantDatabaseTab onSuccess={refetchTenant} tenant={tenant} />
        </TabsContent>
        <TabsContent value="users">
          <TenantUsersTab
            availableUsers={availableUsers}
            availableUsersLoading={allUsersLoading}
            isLoading={usersLoading}
            onRefresh={handleRefresh}
            onRemove={handleRemoveUser}
            onResendInvite={handleResendInvite}
            onUpdateRole={handleUpdateUserRole}
            tenantId={tenantId}
            users={usersList}
          />
        </TabsContent>
        <TabsContent value="branches">
          <TenantBranchesTab tenantId={tenantId} />
        </TabsContent>
        <TabsContent value="subscription">
          <TenantSubscriptionTab tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}

export default function EditTenantPage() {
  const params = useParams();
  const tenantId = params.id as string;

  return (
    <AdminGuard>
      <TenantPageContent tenantId={tenantId} />
    </AdminGuard>
  );
}
