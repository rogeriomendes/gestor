"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useParams } from "next/navigation";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Badge } from "@/components/ui/badge";
import { ListItemSkeleton } from "@/components/ui/list-skeleton";
import { trpc } from "@/utils/trpc";
import { PlanStatusBadge } from "../_components/plan-status-badge";
import { PlanEditForm } from "./_components/plan-edit-form";

function formatPrice(price: number | string): string {
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
  return numPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function PlanDetailsPageContent() {
  const params = useParams();
  const planId = params.id as string;

  const { data: plan, isLoading } = useQuery({
    ...trpc.admin.plans.get.queryOptions({ planId }),
  });

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Planos", href: "/admin/plans" as Route },
    { label: plan?.name || "Carregando...", isCurrent: true },
  ];

  if (isLoading) {
    return (
      <PageLayout breadcrumbs={breadcrumbs} title="Carregando...">
        <ListItemSkeleton count={3} />
      </PageLayout>
    );
  }

  if (!plan) {
    return (
      <PageLayout breadcrumbs={breadcrumbs} title="Plano não encontrado">
        <p className="text-muted-foreground">
          O plano solicitado não foi encontrado.
        </p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      actions={
        <div className="flex items-center gap-2">
          <PlanStatusBadge active={plan.active} />
          {plan.isDefault && (
            <Badge
              className="text-yellow-700 ring-1 ring-yellow-600/20 ring-inset"
              variant="outline"
            >
              Plano Padrão
            </Badge>
          )}
          <Badge variant="secondary">
            {plan._count.subscriptions} assinatura
            {plan._count.subscriptions !== 1 ? "s" : ""}
          </Badge>
        </div>
      }
      breadcrumbs={breadcrumbs}
      subtitle={`${formatPrice(plan.price as unknown as number)}/mês - ${plan.description || "Edite as configurações do plano"}`}
      title={plan.name}
    >
      <PlanEditForm
        plan={{
          ...plan,
          price: Number(plan.price),
        }}
      />
    </PageLayout>
  );
}

export default function PlanDetailsPage() {
  return (
    <AdminGuard>
      <PlanDetailsPageContent />
    </AdminGuard>
  );
}
