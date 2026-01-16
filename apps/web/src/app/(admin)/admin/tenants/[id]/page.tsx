"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { TenantGuard, type TenantWithRelations } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc, trpcClient } from "@/utils/trpc";
import { TenantBranchesTab } from "./_components/tenant-branches-tab";
import { TenantDatabaseTab } from "./_components/tenant-database-tab";
import { TenantDetailsForm } from "./_components/tenant-details-form";
import { TenantSubscriptionTab } from "./_components/tenant-subscription-tab";
import { TenantUsersTab } from "./_components/tenant-users-tab";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

interface TenantPageContentProps {
  tenant: TenantWithRelations;
  tenantId: string;
}

function TenantPageContent({ tenant, tenantId }: TenantPageContentProps) {
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

  const { refetch: refetchTenant } = useQuery({
    ...trpc.admin.getTenant.queryOptions({ tenantId }),
    enabled: false, // Já carregado pelo TenantGuard
  });

  const removeUserMutation = useMutation({
    mutationFn: (input: { tenantId: string; userId: string }) =>
      trpcClient.admin.removeUserFromTenant.mutate(input),
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: (input: { tenantId: string; userId: string; role: Role }) =>
      trpcClient.admin.updateUserRoleInTenant.mutate(input),
  });

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
    })) || [];

  return (
    <PageLayout
      backHref="/admin/tenants"
      breadcrumbs={breadcrumbs}
      showBackButton={true}
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
    <TenantGuard tenantId={tenantId}>
      {({ tenant }) => (
        <TenantPageContent tenant={tenant} tenantId={tenantId} />
      )}
    </TenantGuard>
  );
}
