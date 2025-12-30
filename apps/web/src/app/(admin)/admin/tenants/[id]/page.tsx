"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TenantGuard, type TenantWithRelations } from "@/components/admin";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { trpc, trpcClient } from "@/utils/trpc";
import { TenantBranchesTab } from "./_components/tenant-branches-tab";
import { TenantDetailsForm } from "./_components/tenant-details-form";
import { TenantUsersTab } from "./_components/tenant-users-tab";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

type TenantPageContentProps = {
  tenant: TenantWithRelations;
  tenantId: string;
};

function TenantPageContent({ tenant, tenantId }: TenantPageContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "users" | "branches">(
    "details"
  );

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
      toast.success("Usuário removido do tenant com sucesso!");
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
    { label: "Admin", href: "/admin" },
    { label: "Tenants", href: "/admin/tenants" },
    { label: tenant.name, isCurrent: true },
  ];

  // Filtrar usuários que não estão no tenant
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
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">{tenant.name}</h2>
          <p className="text-muted-foreground text-sm">
            {tenant.slug} {tenant.active ? "• Ativo" : "• Inativo"}
          </p>
        </div>
        <Button onClick={() => router.push("/admin/tenants")} variant="outline">
          Voltar para Tenants
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`border-b-2 px-1 py-4 font-medium text-sm ${
              activeTab === "details"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("details")}
            type="button"
          >
            Detalhes
          </button>
          <button
            className={`border-b-2 px-1 py-4 font-medium text-sm ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("users")}
            type="button"
          >
            Usuários ({tenant.users?.length || 0})
          </button>
          <button
            className={`border-b-2 px-1 py-4 font-medium text-sm ${
              activeTab === "branches"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:border-gray-300 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("branches")}
            type="button"
          >
            Filiais ({(tenant as any).branches?.length || 0})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "details" ? (
        <TenantDetailsForm onSuccess={refetchTenant} tenant={tenant} />
      ) : activeTab === "users" ? (
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
      ) : (
        <TenantBranchesTab tenantId={tenantId} />
      )}
    </div>
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
