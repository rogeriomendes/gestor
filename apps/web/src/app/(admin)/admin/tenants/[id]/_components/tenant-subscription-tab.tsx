"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Ban, Check, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
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
import { ListItemSkeleton } from "@/components/ui/list-skeleton";
import { trpc } from "@/utils/trpc";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

interface TenantSubscriptionTabProps {
  tenantId: string;
}

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  switch (status) {
    case "TRIAL":
      return (
        <Badge
          className="text-blue-700 ring-1 ring-blue-600/20 ring-inset"
          variant="outline"
        >
          <Clock className="mr-1 h-3 w-3" /> Trial
        </Badge>
      );
    case "ACTIVE":
      return (
        <Badge
          className="text-green-700 ring-1 ring-green-600/20 ring-inset"
          variant="outline"
        >
          <Check className="mr-1 h-3 w-3" /> Ativo
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge
          className="text-yellow-700 ring-1 ring-yellow-600/20 ring-inset"
          variant="outline"
        >
          <AlertTriangle className="mr-1 h-3 w-3" /> Expirado
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          className="text-red-700 ring-1 ring-red-600/20 ring-inset"
          variant="outline"
        >
          <Ban className="mr-1 h-3 w-3" /> Cancelado
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
  return numPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function TenantSubscriptionTab({
  tenantId,
}: TenantSubscriptionTabProps) {
  const { data: subscription, isLoading } = useQuery({
    ...trpc.admin.subscriptions.getByTenant.queryOptions({ tenantId }),
  });

  if (isLoading) {
    return <ListItemSkeleton count={1} />;
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sem Assinatura</CardTitle>
          <CardDescription>
            Este cliente não possui uma assinatura configurada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionGuard action="CREATE" resource="SUBSCRIPTION">
            <Link href={`/admin/subscriptions/${tenantId}`}>
              <Button>Criar Assinatura</Button>
            </Link>
          </PermissionGuard>
        </CardContent>
      </Card>
    );
  }

  const expiresAt = subscription.expiresAt
    ? new Date(subscription.expiresAt)
    : null;
  const trialEndsAt = subscription.trialEndsAt
    ? new Date(subscription.trialEndsAt)
    : null;
  const isExpiringSoon =
    expiresAt &&
    expiresAt > new Date() &&
    expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status da Assinatura</CardTitle>
              <CardDescription>
                Informações sobre o plano e assinatura atual
              </CardDescription>
            </div>
            <PermissionGuard action="READ" resource="SUBSCRIPTION">
              <Link href={`/admin/subscriptions/${tenantId}`}>
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" /> Gerenciar
                </Button>
              </Link>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <dt className="text-muted-foreground text-sm">Status</dt>
              <dd className="mt-1">
                <SubscriptionStatusBadge
                  status={subscription.status as SubscriptionStatus}
                />
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Plano</dt>
              <dd className="mt-1 font-medium">
                <Link
                  className="hover:underline"
                  href={`/admin/plans/${subscription.plan.id}`}
                >
                  {subscription.plan.name}
                </Link>
                <span className="ml-2 text-muted-foreground text-sm">
                  ({formatPrice(subscription.plan.price as unknown as number)}
                  /mês)
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Data de Início</dt>
              <dd className="mt-1 font-medium">
                {format(new Date(subscription.startDate), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </dd>
            </div>
            {subscription.status === "TRIAL" && trialEndsAt && (
              <div>
                <dt className="text-muted-foreground text-sm">Fim do Trial</dt>
                <dd className="mt-1 font-medium">
                  {format(trialEndsAt, "dd/MM/yyyy", { locale: ptBR })}
                  <br />
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(trialEndsAt, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </dd>
              </div>
            )}
            {expiresAt && (
              <div>
                <dt className="text-muted-foreground text-sm">Expiração</dt>
                <dd className="mt-1 font-medium">
                  {format(expiresAt, "dd/MM/yyyy", { locale: ptBR })}
                  {isExpiringSoon && (
                    <Badge
                      className="ml-2 text-orange-700 ring-1 ring-orange-600/20 ring-inset"
                      variant="outline"
                    >
                      Expira em breve
                    </Badge>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Plan Description Card */}
      {subscription.plan.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrição do Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {subscription.plan.description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
