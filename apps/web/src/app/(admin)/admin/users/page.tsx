"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Route } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc, trpcClient } from "@/utils/trpc";
import { CreateUserDialog } from "./_components/create-user-dialog";
import { EditUserDialog } from "./_components/edit-user-dialog";
import { UsersFilters } from "./_components/users-filters";
import { UsersList } from "./_components/users-list";

function AdminUsersPageContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<{
    id: string;
    name: string;
    email: string;
    tenantId?: string | null;
    role?: string | null;
  } | null>(null);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const limit = 20;

  // Buscar tenants para o filtro
  const { data: tenantsData } = useQuery({
    ...trpc.admin.listTenants.queryOptions({ page: 1, limit: 100 }),
  });

  // Buscar usuários com filtros
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    refetch,
  } = useQuery({
    ...trpc.admin.listAllUsers.queryOptions({
      page,
      limit,
      search: search || undefined,
      tenantId: selectedTenant !== "all" ? selectedTenant : undefined,
    }),
  });

  // Buscar usuários deletados
  const {
    data: deletedUsersData,
    isLoading: isLoadingDeletedUsers,
    refetch: refetchDeletedUsers,
  } = useQuery({
    ...trpc.admin.listDeletedUsers.queryOptions({
      page: 1,
      limit: 100,
      search: search || undefined,
      tenantId: selectedTenant !== "all" ? selectedTenant : undefined,
    }),
    enabled: showDeleted,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      trpcClient.admin.deleteUser.mutate({ userId }),
  });

  const restoreUserMutation = useMutation({
    mutationFn: (userId: string) =>
      trpcClient.admin.restoreUser.mutate({ userId }),
  });

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;
  const deletedUsers = deletedUsersData?.data || [];

  const tenants = tenantsData?.data || [];

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      toast.success("Usuário deletado com sucesso!");
      refetch();
      setDeletingUserId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar usuário"
      );
    }
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      await restoreUserMutation.mutateAsync(userId);
      toast.success("Usuário restaurado com sucesso!");
      refetch();
      refetchDeletedUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao restaurar usuário"
      );
    }
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Usuários", isCurrent: true },
  ];

  return (
    <PageLayout
      actions={
        <Button onClick={() => setCreateUserDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Usuário
        </Button>
      }
      breadcrumbs={breadcrumbs}
      subtitle="Gerencie todos os usuários do sistema"
      title="Usuários"
    >
      <div className="space-y-4">
        <UsersFilters
          onRoleChange={(value) => {
            setSelectedRole(value || "all");
            setPage(1);
          }}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onShowDeletedChange={(value) => {
            setShowDeleted(value);
            setPage(1);
          }}
          onTenantChange={(value) => {
            setSelectedTenant(value || "all");
            setPage(1);
          }}
          search={search}
          selectedRole={selectedRole}
          selectedTenant={selectedTenant}
          showDeleted={showDeleted}
          tenants={tenants}
        />

        {showDeleted ? (
          <UsersList
            isLoading={isLoadingDeletedUsers}
            onDelete={undefined}
            onEdit={(userId, userName, userEmail, tenantId, role) =>
              setEditingUser({
                id: userId,
                name: userName,
                email: userEmail,
                tenantId,
                role,
              })
            }
            onPageChange={() => {
              // Paginação desabilitada para usuários deletados
            }}
            onRestore={handleRestoreUser}
            pagination={undefined}
            selectedRole="all"
            users={deletedUsers.map((user) => ({
              ...user,
              user: {
                ...user.user,
                createdAt: new Date(user.user.createdAt),
              },
            }))}
          />
        ) : (
          <UsersList
            isLoading={isLoadingUsers}
            onDelete={(userId) => setDeletingUserId(userId)}
            onEdit={(userId, userName, userEmail, tenantId, role) =>
              setEditingUser({
                id: userId,
                name: userName,
                email: userEmail,
                tenantId,
                role,
              })
            }
            onPageChange={setPage}
            pagination={pagination}
            selectedRole={selectedRole}
            users={users}
          />
        )}
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog
        onOpenChange={setCreateUserDialogOpen}
        onSuccess={() => {
          refetch();
          setCreateUserDialogOpen(false);
        }}
        open={createUserDialogOpen}
      />

      {/* Delete User Confirmation Dialog */}
      <Dialog
        onOpenChange={(open: boolean) => !open && setDeletingUserId(null)}
        open={!!deletingUserId}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este usuário? Esta ação pode ser
              revertida posteriormente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={deleteUserMutation.isPending}
              onClick={() => setDeletingUserId(null)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={deleteUserMutation.isPending}
              onClick={() => deletingUserId && handleDeleteUser(deletingUserId)}
              variant="destructive"
            >
              {deleteUserMutation.isPending ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          userRole={editingUser.role}
          userTenantId={editingUser.tenantId}
        />
      )}
    </PageLayout>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersPageContent />
    </AdminGuard>
  );
}
