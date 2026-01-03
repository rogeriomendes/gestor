"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ListItemSkeleton } from "@/components/ui/list-skeleton";
import { trpc, trpcClient } from "@/utils/trpc";
import { SubscriptionStatusBadge } from "../_components/subscription-status-badge";
import { SubscriptionEditForm } from "./_components/subscription-edit-form";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

function SubscriptionDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId as string;

  const { data: subscription, isLoading } = useQuery({
    ...trpc.admin.subscriptions.getByTenant.queryOptions({ tenantId }),
  });

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Assinaturas", href: "/admin/subscriptions" as Route },
    {
      label: subscription?.tenant.name || "Carregando...",
      isCurrent: true,
    },
  ];

  if (isLoading) {
    return (
      <PageLayout breadcrumbs={breadcrumbs} title="Carregando...">
        <ListItemSkeleton count={3} />
      </PageLayout>
    );
  }

  if (!subscription) {
    return (
      <PageLayout breadcrumbs={breadcrumbs} title="Assinatura não encontrada">
        <Card>
          <CardHeader>
            <CardTitle>Tenant sem assinatura</CardTitle>
            <CardDescription>
              Este tenant não possui uma assinatura. Você pode criar uma
              assinatura trial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={async () => {
                try {
                  await trpcClient.admin.subscriptions.createTrial.mutate({
                    tenantId,
                  });
                  router.refresh();
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              Criar Assinatura Trial
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      actions={
        <div className="flex items-center gap-2">
          <SubscriptionStatusBadge
            status={subscription.status as SubscriptionStatus}
          />
          <Link href={`/admin/tenants/${subscription.tenant.id}`}>
            <Button variant="outline">Ver Tenant</Button>
          </Link>
        </div>
      }
      breadcrumbs={breadcrumbs}
      subtitle={`Assinatura do plano ${subscription.plan.name}`}
      title={subscription.tenant.name}
    >
      <div className="space-y-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Assinatura</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Tenant</dt>
                <dd className="font-medium">{subscription.tenant.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Plano</dt>
                <dd className="font-medium">{subscription.plan.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Data de Início</dt>
                <dd className="font-medium">
                  {format(new Date(subscription.startDate), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <SubscriptionStatusBadge
                    status={subscription.status as SubscriptionStatus}
                  />
                </dd>
              </div>
              {subscription.trialEndsAt && (
                <div>
                  <dt className="text-muted-foreground">Fim do Trial</dt>
                  <dd className="font-medium">
                    {format(new Date(subscription.trialEndsAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </dd>
                </div>
              )}
              {subscription.expiresAt && (
                <div>
                  <dt className="text-muted-foreground">Expira em</dt>
                  <dd className="font-medium">
                    {format(new Date(subscription.expiresAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <SubscriptionEditForm
          subscription={{
            ...subscription,
            startDate: subscription.startDate.toString(),
            expiresAt: subscription.expiresAt?.toString() || null,
            trialEndsAt: subscription.trialEndsAt?.toString() || null,
          }}
        />
      </div>
    </PageLayout>
  );
}

export default function SubscriptionDetailsPage() {
  return (
    <AdminGuard>
      <SubscriptionDetailsPageContent />
    </AdminGuard>
  );
}
