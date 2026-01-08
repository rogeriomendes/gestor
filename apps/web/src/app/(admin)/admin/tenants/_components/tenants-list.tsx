"use client";

import { MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {tenants.length} cliente{tenants.length !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            Lista de todos os clientes cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ListItemSkeleton count={5} />
        </CardContent>
      </Card>
    );
  }

  if (tenants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>0 clientes</CardTitle>
          <CardDescription>
            Lista de todos os clientes cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PlusCircle className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Nenhum cliente encontrado</EmptyTitle>
              <EmptyDescription>
                Comece criando seu primeiro cliente.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <PermissionGuard action="CREATE" resource="TENANT">
                <Button onClick={() => router.push("/admin/tenants/new")}>
                  Criar Cliente
                </Button>
              </PermissionGuard>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {tenants.length} cliente{tenants.length !== 1 ? "s" : ""}
        </CardTitle>
        <CardDescription>
          Lista de todos os clientes cadastrados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                <PermissionGuard action="UPDATE" resource="TENANT">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button className="h-8 w-8 p-0" variant="ghost" />
                      }
                    >
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <PermissionGuard action="READ" resource="TENANT">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/tenants/${tenant.id}`)
                            }
                          >
                            <MoreHorizontal className="mr-2 h-4 w-4" />{" "}
                            Ver/Editar
                          </DropdownMenuItem>
                        </PermissionGuard>
                        <PermissionGuard action="DELETE" resource="TENANT">
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(tenant)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Deletar
                          </DropdownMenuItem>
                        </PermissionGuard>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PermissionGuard>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
