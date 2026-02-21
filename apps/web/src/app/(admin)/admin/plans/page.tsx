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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { trpc, trpcClient } from "@/utils/trpc";
import { PlanEditForm } from "./_components/plan-edit-form";
import { PlanForm } from "./_components/plan-form";
import { PlansFilters } from "./_components/plans-filters";
import { PlansList } from "./_components/plans-list";

interface Plan {
  _count: {
    subscriptions: number;
  };
  active: boolean;
  description: string | null;
  id: string;
  isDefault: boolean;
  name: string;
  price: number | string;
}

function AdminPlansPageContent() {
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
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

  const { data: editingPlan, isLoading: isEditingPlanLoading } = useQuery({
    ...trpc.admin.plans.get.queryOptions({
      planId: editingPlanId ?? "",
    }),
    enabled: !!editingPlanId,
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
    try {
      await deactivatePlanMutation.mutateAsync({ planId: selectedPlan.id });
      toast.success("Plano desativado com sucesso!");
      refetchPlans();
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
  };

  const handleActivatePlan = async () => {
    if (!selectedPlan) {
      return;
    }
    try {
      await activatePlanMutation.mutateAsync({ planId: selectedPlan.id });
      toast.success("Plano ativado com sucesso!");
      refetchPlans();
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    }
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
            icon={PlusCircle}
            label="Criar Plano"
            onClick={() => setCreateDialogOpen(true)}
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
          onCreate={() => setCreateDialogOpen(true)}
          onDeactivate={(plan) => {
            setSelectedPlan(plan);
            setDeactivateDialogOpen(true);
          }}
          onEdit={(plan) => setEditingPlanId(plan.id)}
          plans={plans}
        />
      </div>

      {/* Deactivate Dialog */}
      <ConfirmDialog
        cancelText="Cancelar"
        confirmText="Desativar"
        description={
          <>
            Tem certeza que deseja desativar o plano "{selectedPlan?.name}"?
            <br />
            <br />
            Assinaturas existentes não serão afetadas, mas novos clientes não
            poderão selecionar este plano.
          </>
        }
        isLoading={deactivatePlanMutation.isPending}
        onConfirm={handleDeactivatePlan}
        onOpenChange={setDeactivateDialogOpen}
        open={deactivateDialogOpen}
        title="Desativar plano"
        variant="destructive"
      />

      {/* Activate Dialog */}
      <ConfirmDialog
        cancelText="Cancelar"
        confirmText="Ativar"
        description={
          <>
            Tem certeza que deseja ativar o plano "{selectedPlan?.name}"?
            <br />
            <br />O plano estará disponível para novas assinaturas.
          </>
        }
        isLoading={activatePlanMutation.isPending}
        onConfirm={handleActivatePlan}
        onOpenChange={setActivateDialogOpen}
        open={activateDialogOpen}
        title="Ativar plano"
      />

      {/* Create Plan Credenza */}
      <Credenza onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
        <CredenzaContent className="max-w-2xl">
          <CredenzaHeader>
            <CredenzaTitle>Criar Novo Plano</CredenzaTitle>
            <CredenzaDescription>
              Defina os limites e funcionalidades do novo plano
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <PlanForm
              onCancel={() => setCreateDialogOpen(false)}
              onSuccess={() => {
                refetchPlans();
                setCreateDialogOpen(false);
              }}
            />
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>

      {/* Edit Plan Credenza */}
      <Credenza
        onOpenChange={(open) => !open && setEditingPlanId(null)}
        open={!!editingPlanId}
      >
        <CredenzaContent className="max-w-2xl">
          <CredenzaHeader>
            <CredenzaTitle>
              {editingPlan ? `Editar: ${editingPlan.name}` : "Editar Plano"}
            </CredenzaTitle>
            <CredenzaDescription>
              {editingPlan
                ? "Altere as configurações do plano"
                : "Carregando..."}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            {isEditingPlanLoading || !editingPlan ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
                Carregando...
              </div>
            ) : (
              <PlanEditForm
                onCancel={() => setEditingPlanId(null)}
                onSuccess={() => {
                  refetchPlans();
                  setEditingPlanId(null);
                }}
                plan={{
                  ...editingPlan,
                  price: Number(editingPlan.price),
                }}
              />
            )}
          </CredenzaBody>
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
