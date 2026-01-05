"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { trpc } from "@/utils/trpc";
import { BranchFormDialog } from "./branch-form-dialog";
import { BranchListItem } from "./branch-list-item";
import { BranchListSkeleton } from "./branch-list-skeleton";

interface TenantBranchesTabProps {
  tenantId: string;
}

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
            Gerenciar filiais deste cliente
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 size-4" /> Adicionar Filial
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {branches.length} filial{branches.length !== 1 ? "is" : ""}
          </CardTitle>
          <CardDescription>
            Lista de todas as filiais cadastradas para este cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            if (branchesLoading) {
              return <BranchListSkeleton count={3} />;
            }
            if (branches.length === 0) {
              return (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <PlusCircle className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhuma Filial Encontrada</EmptyTitle>
                    <EmptyDescription>
                      Nenhuma filial cadastrada ainda. Comece criando sua
                      primeira filial.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <PlusCircle className="mr-2 size-4" /> Adicionar Primeira
                      Filial
                    </Button>
                  </EmptyContent>
                </Empty>
              );
            }
            return (
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
            );
          })()}
        </CardContent>
      </Card>

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
