"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MapPin, PlusCircle } from "lucide-react";
import { useState } from "react";
import { DataCards } from "@/components/lists/data-cards";
import { DataTable } from "@/components/lists/data-table";
import { ResponsiveList } from "@/components/lists/responsive-list";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { BranchFormDialog } from "./branch-form-dialog";

interface TenantBranchesTabProps {
  tenantId: string;
}

interface Branch {
  active: boolean;
  addressCity: string | null;
  addressState: string | null;
  cnpj: string | null;
  email: string | null;
  id: string;
  isMain: boolean;
  legalName: string | null;
  name: string;
  phone: string | null;
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

  const branches: Branch[] = branchesData?.data || [];

  const handleEdit = (branchId: string) => {
    setEditingBranchId(branchId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBranchId(null);
    refetchBranches();
  };

  const columns: ColumnDef<Branch>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => {
        const branch = row.original;
        const addressParts = [branch.addressCity, branch.addressState].filter(
          Boolean
        );

        return (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm">{branch.name}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {branch.isMain && (
                  <Badge className="text-xs" variant="default">
                    Principal
                  </Badge>
                )}
                {!branch.active && (
                  <Badge className="text-xs" variant="secondary">
                    Inativa
                  </Badge>
                )}
              </div>
            </div>
            {branch.legalName && (
              <span className="text-muted-foreground text-xs">
                {branch.legalName}
              </span>
            )}
            {addressParts.length > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <MapPin className="h-3 w-3" />
                {addressParts.join(", ")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Contato",
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div className="flex flex-col gap-1 text-xs">
            {branch.email && (
              <span className="truncate text-muted-foreground">
                {branch.email}
              </span>
            )}
            {branch.phone && <span>{branch.phone}</span>}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div className="flex justify-end">
            <PermissionGuard action="UPDATE" resource="BRANCH">
              <Button
                onClick={() => handleEdit(branch.id)}
                size="sm"
                variant="outline"
              >
                Editar
              </Button>
            </PermissionGuard>
          </div>
        );
      },
    },
  ];

  const renderTable = (data: Branch[]) => (
    <DataTable<Branch> columns={columns} data={data} />
  );

  const renderCards = (data: Branch[]) => (
    <DataCards<Branch>
      data={data}
      emptyMessage="Nenhuma filial encontrada."
      renderCard={(branch) => {
        const addressParts = [branch.addressCity, branch.addressState].filter(
          Boolean
        );

        return (
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-sm leading-tight">
                    {branch.name}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {branch.isMain && (
                      <Badge className="text-xs" variant="default">
                        Principal
                      </Badge>
                    )}
                    {!branch.active && (
                      <Badge className="text-xs" variant="secondary">
                        Inativa
                      </Badge>
                    )}
                  </div>
                </div>
                {branch.legalName && (
                  <p className="truncate text-muted-foreground text-xs">
                    {branch.legalName}
                  </p>
                )}
              </div>
              <PermissionGuard action="UPDATE" resource="BRANCH">
                <Button
                  className="h-6 px-2 text-xs"
                  onClick={() => handleEdit(branch.id)}
                  variant="outline"
                >
                  Editar
                </Button>
              </PermissionGuard>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {branch.email && (
                <span className="truncate text-muted-foreground">
                  {branch.email}
                </span>
              )}
              {branch.phone && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{branch.phone}</span>
                </>
              )}
              {addressParts.length > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {addressParts.join(", ")}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      }}
    />
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filiais</CardTitle>
              <CardDescription>Gerenciar filiais deste cliente</CardDescription>
            </div>
            <PermissionGuard action="CREATE" resource="BRANCH">
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 size-4" /> Adicionar Filial
              </Button>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveList<Branch>
            data={branches}
            emptyAction={
              <PermissionGuard action="CREATE" resource="BRANCH">
                <Button onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="mr-2 size-4" /> Adicionar Primeira
                  Filial
                </Button>
              </PermissionGuard>
            }
            emptyDescription="Nenhuma filial cadastrada ainda. Comece criando sua primeira filial."
            emptyTitle="Nenhuma Filial Encontrada"
            isLoading={branchesLoading}
            renderCards={renderCards}
            renderTable={renderTable}
            skeletonColumnCount={3}
          />
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
