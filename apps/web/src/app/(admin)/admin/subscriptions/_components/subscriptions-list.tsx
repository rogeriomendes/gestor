"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Building2,
  MoreHorizontal,
  PlusCircle,
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
import { SubscriptionStatusBadge } from "./subscription-status-badge";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  startDate: string;
  expiresAt: string | null;
  trialEndsAt: string | null;
  tenant: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
  };
  plan: {
    id: string;
    name: string;
    active: boolean;
  };
}

interface SubscriptionsListProps {
  subscriptions: Subscription[];
  isLoading?: boolean;
  onCancel: (subscription: Subscription) => void;
  onCreateSubscription?: () => void;
}

export function SubscriptionsList({
  subscriptions,
  isLoading = false,
  onCancel,
  onCreateSubscription,
}: SubscriptionsListProps) {
  const router = useRouter();

  const columns: ColumnDef<Subscription>[] = [
    {
      accessorKey: "tenant.name",
      header: "Cliente",
      cell: ({ row }) => {
        const subscription = row.original;
        return (
          <div>
            <Link
              className="font-medium hover:underline"
              href={`/admin/tenants/${subscription.tenant.id}` as Route}
            >
              {subscription.tenant.name}
            </Link>
            <p className="text-muted-foreground text-sm">
              Plano: {subscription.plan.name}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        return <SubscriptionStatusBadge status={row.original.status} />;
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Expira em",
      cell: ({ row }) => {
        const expiresAt = row.original.expiresAt
          ? new Date(row.original.expiresAt)
          : null;
        if (!expiresAt) {
          return <span className="text-muted-foreground text-sm">N/A</span>;
        }
        const isExpired = expiresAt < new Date();
        return (
          <span className={`text-sm ${isExpired ? "text-destructive" : ""}`}>
            {format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        );
      },
    },
    {
      id: "warnings",
      header: "Avisos",
      cell: ({ row }) => {
        const subscription = row.original;
        const expiresAt = subscription.expiresAt
          ? new Date(subscription.expiresAt)
          : null;
        const isExpiringSoon =
          expiresAt &&
          expiresAt > new Date() &&
          expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        return (
          <div className="flex items-center gap-2">
            {isExpiringSoon && (
              <Badge
                className="text-orange-700 ring-1 ring-orange-600/20 ring-inset"
                variant="outline"
              >
                Expira em breve
              </Badge>
            )}
            {!subscription.tenant.active && (
              <Badge
                className="text-gray-500 ring-1 ring-gray-400/20 ring-inset"
                variant="outline"
              >
                Cliente inativo
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const subscription = row.original;
        return (
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
                <PermissionGuard action="READ" resource="SUBSCRIPTION">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(
                        `/admin/subscriptions/${subscription.tenant.id}`
                      )
                    }
                  >
                    <MoreHorizontal className="mr-2 h-4 w-4" /> Ver/Editar
                  </DropdownMenuItem>
                </PermissionGuard>
                <PermissionGuard action="READ" resource="TENANT">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/admin/tenants/${subscription.tenant.id}`)
                    }
                  >
                    <Building2 className="mr-2 h-4 w-4" /> Ver Cliente
                  </DropdownMenuItem>
                </PermissionGuard>
                <DropdownMenuSeparator />
                {subscription.status !== "CANCELLED" && (
                  <PermissionGuard action="UPDATE" resource="SUBSCRIPTION">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onCancel(subscription)}
                    >
                      Cancelar Assinatura
                    </DropdownMenuItem>
                  </PermissionGuard>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const renderTable = (data: Subscription[]) => (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhuma assinatura encontrada."
      onRowClick={(subscription) =>
        router.push(`/admin/subscriptions/${subscription.tenant.id}`)
      }
    />
  );

  const renderCards = (data: Subscription[]) => (
    <DataCards
      data={data}
      emptyMessage="Nenhuma assinatura encontrada."
      onCardClick={(subscription) =>
        router.push(`/admin/subscriptions/${subscription.tenant.id}`)
      }
      renderCard={(subscription) => {
        const expiresAt = subscription.expiresAt
          ? new Date(subscription.expiresAt)
          : null;
        const isExpiringSoon =
          expiresAt &&
          expiresAt > new Date() &&
          expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        return (
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  className="truncate font-semibold text-sm leading-tight hover:underline"
                  href={`/admin/tenants/${subscription.tenant.id}` as Route}
                  onClick={(e) => e.stopPropagation()}
                >
                  {subscription.tenant.name}
                </Link>
                <p className="truncate text-muted-foreground text-xs">
                  Plano: {subscription.plan.name}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <SubscriptionStatusBadge status={subscription.status} />
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
                      <PermissionGuard action="READ" resource="SUBSCRIPTION">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/admin/subscriptions/${subscription.tenant.id}`
                            );
                          }}
                        >
                          <MoreHorizontal className="mr-2 h-4 w-4" /> Ver/Editar
                        </DropdownMenuItem>
                      </PermissionGuard>
                      <PermissionGuard action="READ" resource="TENANT">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/admin/tenants/${subscription.tenant.id}`
                            );
                          }}
                        >
                          <Building2 className="mr-2 h-4 w-4" /> Ver Cliente
                        </DropdownMenuItem>
                      </PermissionGuard>
                      <DropdownMenuSeparator />
                      {subscription.status !== "CANCELLED" && (
                        <PermissionGuard
                          action="UPDATE"
                          resource="SUBSCRIPTION"
                        >
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancel(subscription);
                            }}
                          >
                            Cancelar Assinatura
                          </DropdownMenuItem>
                        </PermissionGuard>
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {expiresAt && (
                <span className="text-muted-foreground">
                  {expiresAt > new Date() ? "Expira em " : "Expirou em "}
                  {format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              )}
              {isExpiringSoon && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge
                    className="text-orange-700 text-xs ring-1 ring-orange-600/20 ring-inset"
                    variant="outline"
                  >
                    Expira em breve
                  </Badge>
                </>
              )}
              {!subscription.tenant.active && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge
                    className="text-gray-500 text-xs ring-1 ring-gray-400/20 ring-inset"
                    variant="outline"
                  >
                    Cliente inativo
                  </Badge>
                </>
              )}
            </div>
          </div>
        );
      }}
    />
  );

  return (
    <div className="space-y-4">
      <ResponsiveList
        data={subscriptions}
        emptyAction={
          <div className="flex gap-2">
            {onCreateSubscription && (
              <Button onClick={onCreateSubscription}>
                <PlusCircle className="mr-2 h-4 w-4" /> Criar Assinatura
              </Button>
            )}
            <Button
              onClick={() => router.push("/admin/tenants/new")}
              variant="outline"
            >
              <Building2 className="mr-2 h-4 w-4" /> Criar Cliente
            </Button>
          </div>
        }
        emptyDescription="Não há assinaturas cadastradas. Você pode criar uma assinatura para um cliente existente ou criar um novo cliente (que já receberá um trial automaticamente)."
        emptyIcon={AlertTriangle}
        emptyTitle="Nenhuma assinatura encontrada"
        isLoading={isLoading}
        renderCards={renderCards}
        renderTable={renderTable}
        skeletonColumnCount={columns.length}
      />
    </div>
  );
}
