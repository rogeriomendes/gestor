"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { Button } from "@/components/ui/button";
import { trpc, trpcClient } from "@/utils/trpc";
import { DeleteTenantDialog } from "./_components/delete-tenant-dialog";
import { DeletedTenantsList } from "./_components/deleted-tenants-list";
import { PermanentDeleteTenantDialog } from "./_components/permanent-delete-tenant-dialog";
import { RestoreTenantDialog } from "./_components/restore-tenant-dialog";
import { TenantsFilters } from "./_components/tenants-filters";
import { TenantsList } from "./_components/tenants-list";

function _AdminTenantsPageContent() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] =
    useState(false);
  const [selectedTenant, setSelectedTenant] = useState<
    | {
        id: string;
        name: string;
        slug: string;
        active: boolean;
      }
    | undefined
  >(undefined);
  const [showDeleted, setShowDeleted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const {
    data: tenantsData,
    isLoading: isTenantsLoading,
    refetch: refetchTenants,
  } = useQuery({
    ...trpc.admin.listTenants.queryOptions({ page: 1, limit: 100 }),
  });

  const {
    data: deletedTenantsData,
    isLoading: isDeletedTenantsLoading,
    refetch: refetchDeletedTenants,
  } = useQuery({
    ...trpc.admin.listDeletedTenants.queryOptions({ page: 1, limit: 100 }),
    enabled: showDeleted,
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (input: { id: string }) =>
      trpcClient.admin.deleteTenant.mutate({ tenantId: input.id }),
  });

  const restoreTenantMutation = useMutation({
    mutationFn: (input: { id: string }) =>
      trpcClient.admin.restoreTenant.mutate({ tenantId: input.id }),
  });

  const permanentDeleteTenantMutation = useMutation({
    mutationFn: (input: { id: string }) =>
      trpcClient.admin.permanentlyDeleteTenant.mutate({ tenantId: input.id }),
  });

  const handleDeleteTenant = async () => {
    if (!selectedTenant) {
      return;
    }
    await deleteTenantMutation.mutateAsync(
      { id: selectedTenant.id },
      {
        onSuccess: () => {
          toast.success("Cliente deletado com sucesso!");
          refetchTenants();
          setDeleteDialogOpen(false);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleRestoreTenant = async () => {
    if (!selectedTenant) {
      return;
    }
    await restoreTenantMutation.mutateAsync(
      { id: selectedTenant.id },
      {
        onSuccess: () => {
          toast.success("Cliente restaurado com sucesso!");
          refetchDeletedTenants();
          refetchTenants();
          setRestoreDialogOpen(false);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handlePermanentDeleteTenant = async () => {
    if (!selectedTenant) {
      return;
    }
    await permanentDeleteTenantMutation.mutateAsync(
      { id: selectedTenant.id },
      {
        onSuccess: () => {
          toast.success("Cliente excluído permanentemente!");
          refetchDeletedTenants();
          setPermanentDeleteDialogOpen(false);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const _isLoading = isTenantsLoading;

  const allTenants = tenantsData?.data || [];
  const deletedTenants = deletedTenantsData?.data || [];

  // Filtrar tenants ativos
  const tenants = allTenants.filter((tenant) => {
    const matchesSearch =
      search === "" ||
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && tenant.active) ||
      (selectedStatus === "inactive" && !tenant.active);
    return matchesSearch && matchesStatus;
  });

  // Filtrar tenants deletados
  const filteredDeletedTenants = deletedTenants.filter((tenant) => {
    const matchesSearch =
      search === "" ||
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("all");
    setShowDeleted(false);
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Clientes", isCurrent: true },
  ];

  return (
    <PageLayout
      actions={
        <PermissionGuard action="CREATE" resource="TENANT">
          <Link href="/admin/tenants/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Criar Cliente
            </Button>
          </Link>
        </PermissionGuard>
      }
      breadcrumbs={breadcrumbs}
      subtitle="Criar e gerenciar todos os clientes do sistema"
      title="Gerenciar Clientes"
    >
      <div className="space-y-6">

        <TenantsFilters
          onResetFilters={handleResetFilters}
          onSearchChange={setSearch}
          onShowDeletedChange={setShowDeleted}
          onStatusChange={setSelectedStatus}
          search={search}
          selectedStatus={selectedStatus}
          showDeleted={showDeleted}
        />

        {showDeleted ? (
          <DeletedTenantsList
            isLoading={isDeletedTenantsLoading}
            onPermanentDelete={(tenant) => {
              setSelectedTenant({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                active: tenant.active,
              });
              setPermanentDeleteDialogOpen(true);
            }}
            onRestore={(tenant) => {
              setSelectedTenant({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                active: tenant.active,
              });
              setRestoreDialogOpen(true);
            }}
            tenants={filteredDeletedTenants}
          />
        ) : (
          <TenantsList
            isLoading={isTenantsLoading}
            onDelete={(tenant) => {
              setSelectedTenant({
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                active: tenant.active,
              });
              setDeleteDialogOpen(true);
            }}
            tenants={tenants}
          />
        )}
      </div>

      <DeleteTenantDialog
        isPending={deleteTenantMutation.isPending}
        onConfirm={handleDeleteTenant}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
        tenantName={selectedTenant?.name}
        tenantSlug={selectedTenant?.slug}
      />

      <RestoreTenantDialog
        isPending={restoreTenantMutation.isPending}
        onConfirm={handleRestoreTenant}
        onOpenChange={setRestoreDialogOpen}
        open={restoreDialogOpen}
        tenantName={selectedTenant?.name}
        tenantSlug={selectedTenant?.slug}
      />

      <PermanentDeleteTenantDialog
        isPending={permanentDeleteTenantMutation.isPending}
        onConfirm={handlePermanentDeleteTenant}
        onOpenChange={setPermanentDeleteDialogOpen}
        open={permanentDeleteDialogOpen}
        tenantName={selectedTenant?.name}
        tenantSlug={selectedTenant?.slug}
      />
    </PageLayout>
  );
}

export default function AdminTenantsPage() {
  return (
    <AdminGuard>
      <_AdminTenantsPageContent />
    </AdminGuard>
  );
}
