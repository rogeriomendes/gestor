"use client";

import { MoreHorizontal, RotateCcw, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListItemSkeleton } from "@/components/ui/list-skeleton";

interface DeletedTenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  deletedAt: Date | string | null;
  deletedByUser: {
    name: string | null;
    email: string;
  } | null;
  _count: {
    users: number;
  };
}

interface DeletedTenantsListProps {
  tenants: DeletedTenant[];
  isLoading: boolean;
  onRestore: (tenant: DeletedTenant) => void;
  onPermanentDelete: (tenant: DeletedTenant) => void;
}

export function DeletedTenantsList({
  tenants,
  isLoading,
  onRestore,
  onPermanentDelete,
}: DeletedTenantsListProps) {
  if (isLoading) {
    return <ListItemSkeleton count={5} />;
  }

  if (tenants.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrashIcon className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum tenant deletado</EmptyTitle>
          <EmptyDescription>
            Não há tenants deletados no momento.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-md border">
      {tenants.map((tenant) => (
        <div
          className="flex items-center justify-between border-b p-4 last:border-b-0"
          key={tenant.id}
        >
          <div className="flex items-center space-x-4">
            <div>
              <div className="font-medium">{tenant.name}</div>
              <p className="text-muted-foreground text-sm">{tenant.slug}</p>
              <p className="text-muted-foreground text-xs">
                {tenant.deletedAt && (
                  <>
                    Deletado em:{" "}
                    {new Date(tenant.deletedAt).toLocaleString("pt-BR")}
                  </>
                )}
                {tenant.deletedByUser && (
                  <>
                    {" "}
                    por{" "}
                    {tenant.deletedByUser.name || tenant.deletedByUser.email}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground text-xs">
              {tenant._count.users} usuários
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button className="h-8 w-8 p-0" variant="ghost" />}
              >
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onRestore(tenant)}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onPermanentDelete(tenant)}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" /> Excluir
                    Permanentemente
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
