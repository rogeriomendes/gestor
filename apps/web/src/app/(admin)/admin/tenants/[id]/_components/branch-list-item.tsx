"use client";

import { useMutation } from "@tanstack/react-query";
import { Edit, MapPin, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpcClient } from "@/utils/trpc";
import { DeleteBranchDialog } from "./delete-branch-dialog";

interface Branch {
  id: string;
  name: string;
  isMain: boolean;
  legalName: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  addressCity: string | null;
  addressState: string | null;
  active: boolean;
}

interface BranchListItemProps {
  branch: Branch;
  onEdit: (branchId: string) => void;
  onRefresh: () => void;
}

export function BranchListItem({
  branch,
  onEdit,
  onRefresh,
}: BranchListItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteBranchMutation = useMutation({
    mutationFn: (branchId: string) =>
      trpcClient.admin.branch.deleteBranch.mutate({ branchId }),
  });

  const setMainBranchMutation = useMutation({
    mutationFn: (branchId: string) =>
      trpcClient.admin.branch.setMainBranch.mutate({ branchId }),
  });

  const handleDelete = async () => {
    try {
      await deleteBranchMutation.mutateAsync(branch.id);
      toast.success("Filial deletada com sucesso!");
      setDeleteDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar filial"
      );
    }
  };

  const handleSetMain = async () => {
    try {
      await setMainBranchMutation.mutateAsync(branch.id);
      toast.success("Filial principal atualizada!");
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao definir filial principal"
      );
    }
  };

  const addressParts = [branch.addressCity, branch.addressState].filter(
    Boolean
  );

  return (
    <Card className="rounded-md transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{branch.name}</CardTitle>
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
              <CardDescription className="mt-1.5 text-sm">
                {branch.legalName}
              </CardDescription>
            )}
          </div>
          <PermissionGuard action="UPDATE" resource="BRANCH">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button className="shrink-0" size="icon" variant="ghost" />
                }
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <PermissionGuard action="UPDATE" resource="BRANCH">
                  <DropdownMenuItem onClick={() => onEdit(branch.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                </PermissionGuard>
                <PermissionGuard action="UPDATE" resource="BRANCH">
                  {!branch.isMain && (
                    <DropdownMenuItem onClick={handleSetMain}>
                      Definir como Principal
                    </DropdownMenuItem>
                  )}
                </PermissionGuard>
                <PermissionGuard action="DELETE" resource="BRANCH">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Deletar
                  </DropdownMenuItem>
                </PermissionGuard>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGuard>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {branch.cnpj && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-20 shrink-0 font-medium text-muted-foreground">
                CNPJ:
              </span>
              <span className="font-mono text-xs">{branch.cnpj}</span>
            </div>
          )}
          {branch.email && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-20 shrink-0 font-medium text-muted-foreground">
                Email:
              </span>
              <span className="truncate">{branch.email}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="w-20 shrink-0 font-medium text-muted-foreground">
                Telefone:
              </span>
              <span>{branch.phone}</span>
            </div>
          )}
          {addressParts.length > 0 && (
            <div className="flex min-w-0 items-start gap-2 sm:col-span-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="break-words">{addressParts.join(", ")}</span>
            </div>
          )}
        </div>
      </CardContent>

      <DeleteBranchDialog
        branchName={branch.name}
        isPending={deleteBranchMutation.isPending}
        onConfirm={handleDelete}
        onOpenChange={setDeleteDialogOpen}
        open={deleteDialogOpen}
      />
    </Card>
  );
}
