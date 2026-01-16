"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  MoreHorizontal,
  PlusCircle,
  Power,
  PowerOff,
  Star,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataCards } from "@/components/lists/data-cards";
import { DataTable } from "@/components/lists/data-table";
import { ResponsiveList } from "@/components/lists/responsive-list";
import { PermissionGuard } from "@/components/permissions/permission-guard";
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

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  active: boolean;
  isDefault: boolean;
  _count: {
    subscriptions: number;
  };
}

function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
  return numPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

interface PlansListProps {
  plans: Plan[];
  isLoading?: boolean;
  onDeactivate: (plan: Plan) => void;
  onActivate: (plan: Plan) => void;
}

export function PlansList({
  plans,
  isLoading = false,
  onDeactivate,
  onActivate,
}: PlansListProps) {
  const router = useRouter();

  const columns: ColumnDef<Plan>[] = [
    {
      accessorKey: "name",
      header: "Plano",
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <div>
            <div className="flex items-center gap-2">
              <Link
                className="font-medium hover:underline"
                href={`/admin/plans/${plan.id}` as Route}
              >
                {plan.name}
              </Link>
              {plan.isDefault && (
                <Badge
                  className="text-yellow-700 ring-1 ring-yellow-600/20 ring-inset"
                  variant="outline"
                >
                  <Star className="mr-1 h-3 w-3" /> Padrão
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {plan.description || "Sem descrição"}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Preço",
      cell: ({ row }) => {
        return (
          <span className="font-medium text-sm">
            {formatPrice(row.original.price)}/mês
          </span>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const plan = row.original;
        return plan.active ? (
          <Badge
            className="text-green-700 ring-1 ring-green-600/20 ring-inset"
            variant="outline"
          >
            <Check className="mr-1 h-3 w-3" /> Ativo
          </Badge>
        ) : (
          <Badge
            className="text-red-700 ring-1 ring-red-600/20 ring-inset"
            variant="outline"
          >
            Inativo
          </Badge>
        );
      },
    },
    {
      accessorKey: "_count.subscriptions",
      header: "Assinaturas",
      cell: ({ row }) => {
        const count = row.original._count.subscriptions;
        return (
          <span className="text-sm">
            {count} assinatura{count !== 1 ? "s" : ""}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <PermissionGuard action="UPDATE" resource="PLAN">
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
                    onClick={() => router.push(`/admin/plans/${plan.id}`)}
                  >
                    <MoreHorizontal className="mr-2 h-4 w-4" /> Ver/Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {plan.active ? (
                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={plan.isDefault}
                      onClick={() => onDeactivate(plan)}
                    >
                      <PowerOff className="mr-2 h-4 w-4" /> Desativar
                    </DropdownMenuItem>
                  ) : (
                    <PermissionGuard action="UPDATE" resource="PLAN">
                      <DropdownMenuItem onClick={() => onActivate(plan)}>
                        <Power className="mr-2 h-4 w-4" /> Ativar
                      </DropdownMenuItem>
                    </PermissionGuard>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGuard>
        );
      },
    },
  ];

  const renderTable = (data: Plan[]) => (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhum plano encontrado."
    />
  );

  const renderCards = (data: Plan[]) => (
    <DataCards
      data={data}
      emptyMessage="Nenhum plano encontrado."
      getHref={(plan) => `/admin/plans/${plan.id}` as Route}
      renderCard={(plan) => (
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="truncate font-semibold text-sm leading-tight">
                  {plan.name}
                </div>
                {plan.isDefault && (
                  <Badge
                    className="shrink-0 text-xs text-yellow-700 ring-1 ring-yellow-600/20 ring-inset"
                    variant="outline"
                  >
                    <Star className="mr-1 h-3 w-3" /> Padrão
                  </Badge>
                )}
              </div>
              <p className="truncate text-muted-foreground text-xs">
                {plan.description || "Sem descrição"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {plan.active ? (
                <Badge
                  className="shrink-0 text-green-700 text-xs ring-1 ring-green-600/20 ring-inset"
                  variant="outline"
                >
                  <Check className="mr-1 h-3 w-3" /> Ativo
                </Badge>
              ) : (
                <Badge
                  className="shrink-0 text-red-700 text-xs ring-1 ring-red-600/20 ring-inset"
                  variant="outline"
                >
                  Inativo
                </Badge>
              )}
              <PermissionGuard action="UPDATE" resource="PLAN">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    render={
                      <Button
                        className="h-6 w-6 shrink-0 p-0"
                        variant="ghost"
                      />
                    }
                  >
                    <span className="sr-only">Abrir menu</span>
                    <MoreHorizontal className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/plans/${plan.id}`);
                        }}
                      >
                        <MoreHorizontal className="mr-2 h-4 w-4" /> Ver/Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {plan.active ? (
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={plan.isDefault}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeactivate(plan);
                          }}
                        >
                          <PowerOff className="mr-2 h-4 w-4" /> Desativar
                        </DropdownMenuItem>
                      ) : (
                        <PermissionGuard action="UPDATE" resource="PLAN">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onActivate(plan);
                            }}
                          >
                            <Power className="mr-2 h-4 w-4" /> Ativar
                          </DropdownMenuItem>
                        </PermissionGuard>
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGuard>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-medium">{formatPrice(plan.price)}/mês</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {plan._count.subscriptions} assinatura
              {plan._count.subscriptions !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    />
  );

  return (
    <div className="space-y-4">
      <ResponsiveList
        data={plans}
        emptyAction={
          <Button onClick={() => router.push("/admin/plans/new")}>
            Criar Plano
          </Button>
        }
        emptyDescription="Comece criando seu primeiro plano."
        emptyIcon={PlusCircle}
        emptyTitle="Nenhum plano encontrado"
        isLoading={isLoading}
        renderCards={renderCards}
        renderTable={renderTable}
        skeletonColumnCount={columns.length}
      />
    </div>
  );
}
