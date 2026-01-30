"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import type { Route } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc, trpcClient } from "@/utils/trpc";
import { SubscriptionsFilters } from "./_components/subscriptions-filters";
import { SubscriptionsList } from "./_components/subscriptions-list";
import { SubscriptionsStatsCards } from "./_components/subscriptions-stats-cards";

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

function AdminSubscriptionsPageContent() {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<
    Subscription | undefined
  >(undefined);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTenant, setFilterTenant] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");

  const {
    data: subscriptionsData,
    isLoading: isSubscriptionsLoading,
    refetch: refetchSubscriptions,
  } = useQuery({
    ...trpc.admin.subscriptions.list.queryOptions({ page: 1, limit: 100 }),
  });

  // Buscar tenants
  const { data: tenantsData } = useQuery({
    ...trpc.admin.listTenants.queryOptions({ page: 1, limit: 100 }),
  });

  // Buscar planos para filtro
  const { data: plansData } = useQuery({
    ...trpc.admin.plans.list.queryOptions({ page: 1, limit: 100 }),
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: (input: { subscriptionId: string }) =>
      trpcClient.admin.subscriptions.cancel.mutate(input),
  });

  const createTrialMutation = useMutation({
    mutationFn: (input: { tenantId: string }) =>
      trpcClient.admin.subscriptions.createTrial.mutate(input),
  });

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) {
      return;
    }
    await cancelSubscriptionMutation.mutateAsync(
      { subscriptionId: selectedSubscription.id },
      {
        onSuccess: () => {
          toast.success("Assinatura cancelada com sucesso!");
          refetchSubscriptions();
          setCancelDialogOpen(false);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleCreateSubscription = async () => {
    if (!selectedTenantId) {
      toast.error("Selecione um cliente");
      return;
    }
    await createTrialMutation.mutateAsync(
      { tenantId: selectedTenantId },
      {
        onSuccess: () => {
          toast.success("Assinatura trial criada com sucesso!");
          refetchSubscriptions();
          setCreateDialogOpen(false);
          setSelectedTenantId("");
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const allSubscriptions = (subscriptionsData?.data || []) as Subscription[];
  const allTenants = tenantsData?.data || [];
  const allPlans = plansData?.data || [];

  // Filtrar assinaturas
  const subscriptions = allSubscriptions.filter((subscription) => {
    const matchesStatus =
      filterStatus === "all" || subscription.status === filterStatus;
    const matchesTenant =
      filterTenant === "all" || subscription.tenant.id === filterTenant;
    const matchesPlan =
      filterPlan === "all" || subscription.plan.id === filterPlan;
    return matchesStatus && matchesTenant && matchesPlan;
  });

  const handleResetFilters = () => {
    setFilterStatus("all");
    setFilterTenant("all");
    setFilterPlan("all");
  };

  // Filtrar tenants que não têm assinatura
  const tenantsWithoutSubscription = allTenants.filter(
    (tenant) => !allSubscriptions.some((sub) => sub.tenant.id === tenant.id)
  );

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Assinaturas", isCurrent: true },
  ];

  return (
    <PageLayout
      actions={
        tenantsWithoutSubscription.length > 0 && (
          <PermissionGuard action="CREATE" resource="SUBSCRIPTION">
            <ActionButton
              icon={PlusCircle}
              label="Criar Assinatura"
              onClick={() => setCreateDialogOpen(true)}
            />
          </PermissionGuard>
        )
      }
      breadcrumbs={breadcrumbs}
      subtitle="Visualizar e gerenciar assinaturas de clientes"
      title="Gerenciar Assinaturas"
    >
      <div className="space-y-6">
        <SubscriptionsStatsCards
          activeSubscriptions={
            subscriptions.filter((s) => s.status === "ACTIVE").length
          }
          cancelledSubscriptions={
            subscriptions.filter((s) => s.status === "CANCELLED").length
          }
          expiredSubscriptions={
            subscriptions.filter((s) => s.status === "EXPIRED").length
          }
          totalSubscriptions={subscriptions.length}
          trialSubscriptions={
            subscriptions.filter((s) => s.status === "TRIAL").length
          }
        />

        <SubscriptionsFilters
          onPlanChange={setFilterPlan}
          onResetFilters={handleResetFilters}
          onStatusChange={setFilterStatus}
          onTenantChange={setFilterTenant}
          plans={allPlans}
          selectedPlan={filterPlan}
          selectedStatus={filterStatus}
          selectedTenant={filterTenant}
          tenants={allTenants}
        />

        <SubscriptionsList
          isLoading={isSubscriptionsLoading}
          onCancel={(subscription) => {
            setSelectedSubscription(subscription);
            setCancelDialogOpen(true);
          }}
          onCreateSubscription={
            tenantsWithoutSubscription.length > 0
              ? () => setCreateDialogOpen(true)
              : undefined
          }
          subscriptions={subscriptions}
        />
      </div>

      {/* Cancel Dialog */}
      <Credenza onOpenChange={setCancelDialogOpen} open={cancelDialogOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Cancelar assinatura</CredenzaTitle>
            <CredenzaDescription>
              Tem certeza que deseja cancelar a assinatura do cliente "
              {selectedSubscription?.tenant.name}"?
              <br />
              <br />
              <strong>Atenção:</strong> O cliente perderá acesso às
              funcionalidades do sistema.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaFooter>
            <Button
              onClick={() => setCancelDialogOpen(false)}
              variant="outline"
            >
              Voltar
            </Button>
            <Button
              disabled={cancelSubscriptionMutation.isPending}
              onClick={handleCancelSubscription}
              variant="destructive"
            >
              {cancelSubscriptionMutation.isPending
                ? "Cancelando..."
                : "Cancelar Assinatura"}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* Create Subscription Dialog */}
      <Credenza onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Criar Assinatura</CredenzaTitle>
            <CredenzaDescription>
              Selecione um cliente para criar uma assinatura trial de 14 dias.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <div className="py-4">
              <Select
                onValueChange={(value) => setSelectedTenantId(value ?? "")}
                value={selectedTenantId}
              >
                <SelectTrigger>
                  <SelectValue>Selecione um cliente</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tenantsWithoutSubscription.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CredenzaBody>
          <CredenzaFooter>
            <Button
              onClick={() => {
                setCreateDialogOpen(false);
                setSelectedTenantId("");
              }}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={createTrialMutation.isPending || !selectedTenantId}
              onClick={handleCreateSubscription}
            >
              {createTrialMutation.isPending
                ? "Criando..."
                : "Criar Assinatura Trial"}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </PageLayout>
  );
}

export default function AdminSubscriptionsPage() {
  return (
    <AdminGuard>
      <AdminSubscriptionsPageContent />
    </AdminGuard>
  );
}
