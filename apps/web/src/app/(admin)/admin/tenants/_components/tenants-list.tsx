"use client";

import { MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListItemSkeleton } from "@/components/ui/list-skeleton";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  _count: {
    users: number;
  };
}

interface TenantsListProps {
  tenants: Tenant[];
  isLoading?: boolean;
  onDelete: (tenant: Tenant) => void;
}

export function TenantsList({
  tenants,
  isLoading = false,
  onDelete,
}: TenantsListProps) {
  const router = useRouter();

  if (isLoading) {
    return <ListItemSkeleton count={5} />;
  }

  if (tenants.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PlusCircle className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum tenant encontrado</EmptyTitle>
          <EmptyDescription>
            Comece criando seu primeiro tenant.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => router.push("/admin/tenants/new")}>
            Criar Tenant
          </Button>
        </EmptyContent>
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
              <Link
                className="font-medium hover:underline"
                href={`/admin/tenants/${tenant.id}`}
              >
                {tenant.name}
              </Link>
              <p className="text-muted-foreground text-sm">{tenant.slug}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {tenant.active ? (
              <Badge
                className="text-green-700 ring-1 ring-green-600/20 ring-inset"
                variant="outline"
              >
                Ativo
              </Badge>
            ) : (
              <Badge
                className="text-red-700 ring-1 ring-red-600/20 ring-inset"
                variant="outline"
              >
                Inativo
              </Badge>
            )}
            <span className="text-muted-foreground text-xs">
              {tenant._count.users} usuário
              {tenant._count.users > 1 ? "s" : null}
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
                  <DropdownMenuItem
                    onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                  >
                    <MoreHorizontal className="mr-2 h-4 w-4" /> Ver/Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(tenant)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Deletar
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
