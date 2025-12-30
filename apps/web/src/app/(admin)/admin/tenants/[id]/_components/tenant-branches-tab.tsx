"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";
import { BranchFormDialog } from "../branches/_components/branch-form-dialog";
import { BranchListItem } from "../branches/_components/branch-list-item";

type TenantBranchesTabProps = {
  tenantId: string;
};

export function TenantBranchesTab({ tenantId }: TenantBranchesTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

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
    enabled: !!tenantId,
  });

  const branches = branchesData?.data || [];

  const handleEdit = (branchId: string) => {
    setEditingBranchId(branchId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBranchId(null);
    refetchBranches();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Filiais</h3>
          <p className="text-muted-foreground text-sm">
            Gerenciar filiais deste tenant
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 size-4" /> Adicionar Filial
        </Button>
      </div>

      {/* Content */}
      {branchesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-32 w-full" key={i} />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <Empty>
          <EmptyTitle>Nenhuma Filial Encontrada</EmptyTitle>
          <EmptyDescription>Nenhuma filial cadastrada ainda.</EmptyDescription>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 size-4" /> Adicionar Primeira Filial
          </Button>
        </Empty>
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
        branchId={editingBranchId}
        onClose={handleCloseDialog}
        open={isDialogOpen || !!editingBranchId}
        tenantId={tenantId}
      />
    </div>
  );
}
