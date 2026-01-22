"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import type { Route } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { EditUserDialog } from "@/app/(admin)/admin/users/_components/edit-user-dialog";
import { PageLayout } from "@/components/layouts/page-layout";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { TenantUsersSkeleton } from "@/components/tenant-loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/contexts/tenant-context";
import { useCanManageUsers } from "@/lib/permissions";
import { trpc, trpcClient } from "@/utils/trpc";
import { AddUserDialog } from "./_components/add-user-dialog";
import { UsersList } from "./_components/users-list";

type Role = "TENANT_OWNER" | "TENANT_USER_MANAGER" | "TENANT_USER";

export default function UsersPage() {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const canManageUsers = useCanManageUsers();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  const {
    data: usersData,
    isLoading: usersLoading,
    refetch,
  } = useQuery({
    ...trpc.tenant.users.listUsers.queryOptions({
      page,
      limit: 20,
      ...(search && { search }),
    }),
    enabled: canManageUsers && !!tenant,
  });

  const removeUserMutation = useMutation({
    mutationFn: (input: { userId: string }) =>
      trpcClient.tenant.users.removeUser.mutate(input),
    onSuccess: () => {
      toast.success("Usuário removido com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover usuário"
      );
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: (input: { userId: string; role: Role }) =>
      trpcClient.tenant.users.updateUserRole.mutate(input),
    onSuccess: () => {
      toast.success("Role do usuário atualizada com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar role"
      );
    },
  });

  if (tenantLoading) {
    return <TenantUsersSkeleton />;
  }

  if (!canManageUsers) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para gerenciar usuários.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  const handleRemove = async (userId: string) => {
    // eslint-disable-next-line no-alert
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      await removeUserMutation.mutateAsync({ userId });
    }
  };

  const handleUpdateRole = async (userId: string, role: Role) => {
    await updateUserRoleMutation.mutateAsync({ userId, role });
  };

  const handleEdit = (userId: string, name: string, email: string) => {
    setEditingUser({ id: userId, name, email });
  };

  const users = (usersData?.data || []).map((user) => ({
    id: user.id,
    userId: user.userId,
    role: (user.role || "TENANT_USER") as Role,
    user: {
      id: user.user.id,
      name: user.user.name,
      email: user.user.email,
    },
  }));

  return (
    <PageLayout
      actions={
        <PermissionGuard action="CREATE" resource="USER">
          <Button onClick={() => setAddUserDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
          </Button>
        </PermissionGuard>
      }
      breadcrumbs={[
        { label: tenant.name, href: "/dashboard" as Route },
        { label: "Usuários" },
      ]}
      subtitle="Gerencie os usuários do seu cliente"
      title="Usuários"
    >
      <div className="space-y-4">
        <Input
          className="max-w-sm"
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar usuários..."
          value={search}
        />
      </div>

      <UsersList
        isLoading={usersLoading}
        onEdit={handleEdit}
        onRemove={handleRemove}
        onUpdateRole={handleUpdateRole}
        users={users}
      />

      <AddUserDialog
        onOpenChange={setAddUserDialogOpen}
        onSuccess={refetch}
        open={addUserDialogOpen}
        tenantId={tenant.id}
      />

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          onOpenChange={(open: boolean) => !open && setEditingUser(null)}
          onSuccess={() => {
            refetch();
            setEditingUser(null);
          }}
          open={!!editingUser}
          userEmail={editingUser.email}
          userId={editingUser.id}
          userName={editingUser.name}
        />
      )}
    </PageLayout>
  );
}
