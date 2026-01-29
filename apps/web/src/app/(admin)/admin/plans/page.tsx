"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import type { Route } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { trpc, trpcClient } from "@/utils/trpc";
import { PlansFilters } from "./_components/plans-filters";
import { PlansList } from "./_components/plans-list";
import { ActionButton } from "@/components/ui/action-button";

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

function AdminPlansPageContent() {
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const {
    data: plansData,
    isLoading: isPlansLoading,
    refetch: refetchPlans,
  } = useQuery({
    ...trpc.admin.plans.list.queryOptions({ page: 1, limit: 100 }),
  });

  const deactivatePlanMutation = useMutation({
    mutationFn: (input: { planId: string }) =>
      trpcClient.admin.plans.deactivate.mutate(input),
  });

  const activatePlanMutation = useMutation({
    mutationFn: (input: { planId: string }) =>
      trpcClient.admin.plans.activate.mutate(input),
  });

  const handleDeactivatePlan = async () => {
    if (!selectedPlan) {
      return;
    }
    await deactivatePlanMutation.mutateAsync(
      { planId: selectedPlan.id },
      {
        onSuccess: () => {
          toast.success("Plano desativado com sucesso!");
          refetchPlans();
          setDeactivateDialogOpen(false);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const handleActivatePlan = async () => {
    if (!selectedPlan) {
      return;
    }
    await activatePlanMutation.mutateAsync(
      { planId: selectedPlan.id },
      {
        onSuccess: () => {
          toast.success("Plano ativado com sucesso!");
          refetchPlans();
          setActivateDialogOpen(false);
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const allPlans = plansData?.data || [];

  // Filtrar planos
  const plans = allPlans.filter((plan) => {
    const matchesSearch =
      search === "" ||
      plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && plan.active) ||
      (selectedStatus === "inactive" && !plan.active);
    return matchesSearch && matchesStatus;
  });

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("all");
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin" as Route },
    { label: "Planos", isCurrent: true },
  ];

  return (
    <PageLayout
      actions={
        <PermissionGuard action="CREATE" resource="PLAN">
          <ActionButton
            href="/admin/plans/new"
            icon={PlusCircle}
            label="Criar Plano"
          />
        </PermissionGuard>
      }
      breadcrumbs={breadcrumbs}
      subtitle="Criar e gerenciar planos de assinatura"
      title="Gerenciar Planos"
    >
      <div className="space-y-4">
        {/* <PlansStatsCards
          activePlans={plans.filter((p) => p.active).length}
          inactivePlans={plans.filter((p) => !p.active).length}
          totalPlans={plans.length}
          totalSubscriptions={plans.reduce(
            (acc, plan) => acc + (plan._count?.subscriptions || 0),
            0
          )}
        /> */}

        <PlansFilters
          onResetFilters={handleResetFilters}
          onSearchChange={setSearch}
          onStatusChange={setSelectedStatus}
          search={search}
          selectedStatus={selectedStatus}
        />

        <PlansList
          isLoading={isPlansLoading}
          onActivate={(plan) => {
            setSelectedPlan(plan);
            setActivateDialogOpen(true);
          }}
          onDeactivate={(plan) => {
            setSelectedPlan(plan);
            setDeactivateDialogOpen(true);
          }}
          plans={plans}
        />
      </div>

      {/* Deactivate Dialog */}
      <Credenza
        onOpenChange={setDeactivateDialogOpen}
        open={deactivateDialogOpen}
      >
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Desativar plano</CredenzaTitle>
            <CredenzaDescription>
              Tem certeza que deseja desativar o plano "{selectedPlan?.name}"?
              <br />
              <br />
              Assinaturas existentes não serão afetadas, mas novos clientes não
              poderão selecionar este plano.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaFooter>
            <Button
              onClick={() => setDeactivateDialogOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={deactivatePlanMutation.isPending}
              onClick={handleDeactivatePlan}
              variant="destructive"
            >
              {deactivatePlanMutation.isPending
                ? "Desativando..."
                : "Desativar"}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

      {/* Activate Dialog */}
      <Credenza onOpenChange={setActivateDialogOpen} open={activateDialogOpen}>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>Ativar plano</CredenzaTitle>
            <CredenzaDescription>
              Tem certeza que deseja ativar o plano "{selectedPlan?.name}"?
              <br />
              <br />O plano estará disponível para novas assinaturas.
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaFooter>
            <Button
              onClick={() => setActivateDialogOpen(false)}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={activatePlanMutation.isPending}
              onClick={handleActivatePlan}
            >
              {activatePlanMutation.isPending ? "Ativando..." : "Ativar"}
            </Button>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>
    </PageLayout>
  );
}

export default function AdminPlansPage() {
  return (
    <AdminGuard>
      <AdminPlansPageContent />
    </AdminGuard>
  );
}
