"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useState } from "react";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { trpc } from "@/utils/trpc";
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
  } | null>(null);
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

  const users = usersData?.data || [];
  const pagination = usersData?.pagination;

  const tenants = tenantsData?.data || [];

  const breadcrumbs = [
    { label: "Admin", href: "/admin" as Route },
    { label: "Usuários", isCurrent: true },
  ];

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      subtitle="Gerencie todos os usuários do sistema"
      title="Usuários"
    >
      <UsersFilters
        onRoleChange={(value) => {
          setSelectedRole(value || "all");
          setPage(1);
        }}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onTenantChange={(value) => {
          setSelectedTenant(value || "all");
          setPage(1);
        }}
        search={search}
        selectedRole={selectedRole}
        selectedTenant={selectedTenant}
        tenants={tenants}
      />

      <UsersList
        isLoading={isLoadingUsers}
        onEdit={(userId, userName, userEmail) =>
          setEditingUser({ id: userId, name: userName, email: userEmail })
        }
        onPageChange={setPage}
        pagination={pagination}
        selectedRole={selectedRole}
        users={users}
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

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersPageContent />
    </AdminGuard>
  );
}
