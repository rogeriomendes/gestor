"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TenantGuard, type TenantWithRelations } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { trpc, trpcClient } from "@/utils/trpc";
import { TenantBranchesTab } from "./_components/tenant-branches-tab";
import { TenantDetailsForm } from "./_components/tenant-details-form";
import { TenantSubscriptionTab } from "./_components/tenant-subscription-tab";
import { TenantTabs } from "./_components/tenant-tabs";
import { TenantUsersTab } from "./_components/tenant-users-tab";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

interface TenantPageContentProps {
  tenant: TenantWithRelations;
  tenantId: string;
}

function TenantPageContent({ tenant, tenantId }: TenantPageContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "details" | "users" | "branches" | "subscription"
  >("details");

  // Todos os hooks são sempre chamados, garantindo ordem consistente
  // Carregar usuários sempre para exibir a contagem na aba, mesmo quando não está ativa
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
      // actions={
      //   <Button onClick={() => router.push("/admin/tenants")} variant="outline">
      //     Voltar para Tenants
      //   </Button>
      // }
      backHref="/admin/tenants"
      breadcrumbs={breadcrumbs}
      showBackButton={true}
      subtitle={`${tenant.slug} ${tenant.active ? "• Ativo" : "• Inativo"}`}
      title={tenant.name}
    >
      <TenantTabs
        activeTab={activeTab}
        branchesCount={
          (tenant as { branches?: Array<{ id: string }> }).branches?.length || 0
        }
        onTabChange={setActiveTab}
        usersCount={tenant.users?.length || 0}
      />

      {/* Tab Content */}
      {(() => {
        if (activeTab === "details") {
          return (
            <TenantDetailsForm onSuccess={refetchTenant} tenant={tenant} />
          );
        }
        if (activeTab === "users") {
          return (
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
          );
        }
        if (activeTab === "branches") {
          return <TenantBranchesTab tenantId={tenantId} />;
        }
        return <TenantSubscriptionTab tenantId={tenantId} />;
      })()}
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
