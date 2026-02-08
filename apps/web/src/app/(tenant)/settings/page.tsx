"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccessDeniedCard } from "@/components/access-denied-card";
import { PageLayout } from "@/components/layouts/page-layout";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { SubscriptionInfoCard } from "@/components/subscription/subscription-info-card";
import { TenantDashboardSkeleton } from "@/components/tenant-loading";
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
import { useTenant } from "@/contexts/tenant-context";
import { trpcClient } from "@/utils/trpc";

export default function SettingsPage() {
  const { tenant, isLoading, refetch } = useTenant();
  const [name, setName] = useState(tenant?.name ?? "");

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
    <PermissionGuard
      action="UPDATE"
      fallback={
        <AccessDeniedCard description="Você não tem permissão para acessar as configurações do cliente." />
      }
      hide={false}
      resource="SETTINGS"
    >
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
                disabled={
                  updateTenantMutation.isPending || name === tenant?.name
                }
                type="submit"
              >
                {updateTenantMutation.isPending
                  ? "Salvando..."
                  : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <SubscriptionInfoCard />
      </PageLayout>
    </PermissionGuard>
  );
}
