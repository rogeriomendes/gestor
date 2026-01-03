"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import type { Route } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      toast.error("Selecione um tenant");
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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Assinatura
          </Button>
        )
      }
      breadcrumbs={breadcrumbs}
      subtitle="Visualizar e gerenciar assinaturas de tenants"
      title="Gerenciar Assinaturas"
    >
      <div className="space-y-4">
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
      <Dialog onOpenChange={setCancelDialogOpen} open={cancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar a assinatura do tenant "
              {selectedSubscription?.tenant.name}"?
              <br />
              <br />
              <strong>Atenção:</strong> O tenant perderá acesso às
              funcionalidades do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subscription Dialog */}
      <Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Assinatura</DialogTitle>
            <DialogDescription>
              Selecione um tenant para criar uma assinatura trial de 14 dias.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              onValueChange={setSelectedTenantId}
              value={selectedTenantId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tenant" />
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
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
