"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Ban, Check, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layouts/page-layout";
import { TenantDashboardSkeleton } from "@/components/tenant-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import { useCanManageTenant } from "@/lib/permissions";
import { trpc, trpcClient } from "@/utils/trpc";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

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

export default function SettingsPage() {
  const { tenant, isLoading, refetch } = useTenant();
  const canManageTenant = useCanManageTenant();
  const [name, setName] = useState(tenant?.name ?? "");

  // Buscar assinatura do tenant
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    ...trpc.tenant.subscription.getMySubscription.queryOptions(),
    enabled: !!tenant,
  });

  // Atualizar o estado quando o tenant mudar
  useEffect(() => {
    if (tenant?.name) {
      setName(tenant.name);
    }
  }, [tenant?.name]);

  const updateTenantMutation = useMutation({
    mutationFn: (input: { name?: string }) =>
      trpcClient.tenant.updateMyTenant.mutate(input),
    onSuccess: () => {
      toast.success("Configurações atualizadas com sucesso");
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar configurações"
      );
    },
  });

  if (isLoading) {
    return <TenantDashboardSkeleton />;
  }

  if (!canManageTenant) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar as configurações do cliente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateTenantMutation.mutateAsync({
      name: name !== tenant?.name ? name : undefined,
    });
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: tenant.name, href: "/" },
        { label: "Configurações" },
      ]}
      subtitle="Gerencie as configurações do seu cliente"
      title="Configurações"
    >
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>
            Atualize as informações básicas do cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Cliente</Label>
              <Input
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do cliente"
                required
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                className="bg-muted"
                disabled
                id="slug"
                value={tenant.slug}
              />
              <p className="text-muted-foreground text-xs">
                O slug não pode ser alterado
              </p>
            </div>

            <Button
              disabled={updateTenantMutation.isPending || name === tenant?.name}
              type="submit"
            >
              {updateTenantMutation.isPending
                ? "Salvando..."
                : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Card de Assinatura */}
      <Card>
        <CardHeader>
          <CardTitle>Assinatura</CardTitle>
          <CardDescription>
            Informações sobre sua assinatura atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionContent
            isLoading={subscriptionLoading}
            subscription={subscription}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

interface SubscriptionData {
  status: string;
  plan: {
    name: string;
    price: unknown;
    description: string | null;
  };
  startDate: string | Date;
  expiresAt: string | Date | null;
  trialEndsAt: string | Date | null;
  daysUntilExpiration: number | null;
  daysUntilTrialEnds: number | null;
}

function SubscriptionContent({
  isLoading,
  subscription,
}: {
  isLoading: boolean;
  subscription: SubscriptionData | null | undefined;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <p className="text-muted-foreground">Nenhuma assinatura encontrada.</p>
    );
  }

  return <SubscriptionInfo subscription={subscription} />;
}

function SubscriptionInfo({
  subscription,
}: {
  subscription: SubscriptionData;
}) {
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
    <dl className="space-y-4">
      <div className="flex items-center justify-between">
        <dt className="text-muted-foreground text-sm">Status</dt>
        <dd>
          <SubscriptionStatusBadge
            status={subscription.status as SubscriptionStatus}
          />
        </dd>
      </div>

      <div className="flex items-center justify-between">
        <dt className="text-muted-foreground text-sm">Plano</dt>
        <dd className="font-medium">
          {subscription.plan.name}
          <span className="ml-2 text-muted-foreground text-sm">
            ({formatPrice(subscription.plan.price as number)}/mês)
          </span>
        </dd>
      </div>

      <div className="flex items-center justify-between">
        <dt className="text-muted-foreground text-sm">Data de Início</dt>
        <dd className="font-medium">
          {format(new Date(subscription.startDate), "dd/MM/yyyy", {
            locale: ptBR,
          })}
        </dd>
      </div>

      {subscription.status === "TRIAL" && trialEndsAt && (
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground text-sm">Fim do Trial</dt>
          <dd className="font-medium">
            {format(trialEndsAt, "dd/MM/yyyy", { locale: ptBR })}
            <span className="ml-2 text-muted-foreground text-xs">
              (
              {formatDistanceToNow(trialEndsAt, {
                addSuffix: true,
                locale: ptBR,
              })}
              )
            </span>
          </dd>
        </div>
      )}

      {expiresAt && (
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground text-sm">Expiração</dt>
          <dd className="font-medium">
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

      {subscription.plan.description && (
        <div className="border-t pt-4">
          <dt className="mb-1 text-muted-foreground text-sm">
            Descrição do Plano
          </dt>
          <dd className="text-sm">{subscription.plan.description}</dd>
        </div>
      )}
    </dl>
  );
}
