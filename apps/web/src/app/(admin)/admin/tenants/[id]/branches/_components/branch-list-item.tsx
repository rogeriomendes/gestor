"use client";

import { useMutation } from "@tanstack/react-query";
import { Edit, MapPin, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

type Branch = {
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
};

type BranchListItemProps = {
  branch: Branch;
  onEdit: (branchId: string) => void;
  onRefresh: () => void;
};

export function BranchListItem({
  branch,
  onEdit,
  onRefresh,
}: BranchListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteBranchMutation = useMutation({
    mutationFn: (branchId: string) =>
      trpcClient.admin.branch.deleteBranch.mutate({ branchId }),
  });

  const setMainBranchMutation = useMutation({
    mutationFn: (branchId: string) =>
      trpcClient.admin.branch.setMainBranch.mutate({ branchId }),
  });

  const handleDelete = async () => {
    if (
      !confirm(
        `Tem certeza que deseja deletar a filial "${branch.name}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBranchMutation.mutateAsync(branch.id);
      toast.success("Filial deletada com sucesso!");
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar filial"
      );
    } finally {
      setIsDeleting(false);
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>{branch.name}</CardTitle>
              {branch.isMain && <Badge variant="default">Principal</Badge>}
              {!branch.active && <Badge variant="secondary">Inativa</Badge>}
            </div>
            {branch.legalName && (
              <CardDescription>{branch.legalName}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon" variant="ghost" />}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(branch.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {!branch.isMain && (
                <DropdownMenuItem onClick={handleSetMain}>
                  Definir como Principal
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {branch.cnpj && (
            <div className="flex items-center gap-2">
              <span className="w-24 text-muted-foreground">CNPJ:</span>
              <span>{branch.cnpj}</span>
            </div>
          )}
          {branch.email && (
            <div className="flex items-center gap-2">
              <span className="w-24 text-muted-foreground">Email:</span>
              <span>{branch.email}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2">
              <span className="w-24 text-muted-foreground">Telefone:</span>
              <span>{branch.phone}</span>
            </div>
          )}
          {addressParts.length > 0 && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>{addressParts.join(", ")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
