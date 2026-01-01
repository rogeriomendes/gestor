"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Button } from "@/components/ui/button";
import { trpc, trpcClient } from "@/utils/trpc";
import { DeleteTenantDialog } from "./_components/delete-tenant-dialog";
import { DeletedTenantsList } from "./_components/deleted-tenants-list";
import { PermanentDeleteTenantDialog } from "./_components/permanent-delete-tenant-dialog";
import { RestoreTenantDialog } from "./_components/restore-tenant-dialog";
import { TenantsList } from "./_components/tenants-list";
import { TenantsTabs } from "./_components/tenants-tabs";

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
  const [activeTab, setActiveTab] = useState("active");

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
    enabled: activeTab === "deleted",
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
          toast.success("Tenant deletado com sucesso!");
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
          toast.success("Tenant restaurado com sucesso!");
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
          toast.success("Tenant excluído permanentemente!");
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

  const tenants = tenantsData?.data || [];
  const deletedTenants = deletedTenantsData?.data || [];

  const breadcrumbs = [
    { label: "Admin", href: "/admin" as Route },
    { label: "Tenants", isCurrent: true },
  ];

  return (
    <PageLayout
      actions={
        <Link href="/admin/tenants/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Tenant
          </Button>
        </Link>
      }
      breadcrumbs={breadcrumbs}
      subtitle="Criar e gerenciar todos os tenants do sistema"
      title="Gerenciar Tenants"
    >
      <div className="space-y-4">
        <TenantsTabs
          activeTab={activeTab}
          deletedCount={deletedTenants.length}
          onTabChange={setActiveTab}
        />

        {activeTab === "active" && (
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

        {activeTab === "deleted" && (
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
            tenants={deletedTenants}
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
