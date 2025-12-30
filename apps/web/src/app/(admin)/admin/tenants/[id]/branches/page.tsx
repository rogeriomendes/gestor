"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TenantWithRelations } from "@/components/admin";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { BranchFormDialog } from "./_components/branch-form-dialog";
import { BranchListItem } from "./_components/branch-list-item";

type TenantBranchesPageContentProps = {
  tenant: TenantWithRelations;
  tenantId: string;
};

function TenantBranchesPageContent({
  tenant,
  tenantId,
}: TenantBranchesPageContentProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<string | null>(null);

  const {
    data: branchesData,
    isLoading: branchesLoading,
    refetch: refetchBranches,
  } = useQuery({
    ...trpc.admin.branch.listBranches.queryOptions({
      tenantId,
      page: 1,
      limit: 100,
    }),
  });

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Tenants", href: "/admin/tenants" },
    { label: tenant.name, href: `/admin/tenants/${tenantId}` },
    { label: "Filiais", isCurrent: true },
  ];

  const branches = branchesData?.data || [];

  const handleEdit = (branchId: string) => {
    setEditingBranch(branchId);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingBranch(null);
    refetchBranches();
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Filiais - {tenant.name}</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie as filiais deste tenant
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/admin/tenants/${tenantId}`)}
            variant="outline"
          >
            Voltar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Nova Filial
          </Button>
        </div>
      </div>

      {/* Branches List */}
      {branchesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-32 w-full" key={i} />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="mb-4 text-muted-foreground">
            Nenhuma filial cadastrada ainda.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Criar Primeira Filial
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {branches.map((branch) => (
            <BranchListItem
              branch={branch}
              key={branch.id}
              onEdit={handleEdit}
              onRefresh={refetchBranches}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <BranchFormDialog
        branchId={editingBranch}
        onClose={handleCloseDialog}
        open={isCreateDialogOpen || !!editingBranch}
        tenantId={tenantId}
      />
    </div>
  );
}

export default function TenantBranchesPage() {
  const params = useParams();
  const tenantId = params.id as string;

  return (
    <AdminGuard>
      <TenantGuard tenantId={tenantId}>
        {({ tenant }) => (
          <TenantBranchesPageContent tenant={tenant} tenantId={tenantId} />
        )}
      </TenantGuard>
    </AdminGuard>
  );
}
