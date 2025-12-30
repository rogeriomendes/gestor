"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TenantDashboardSkeleton } from "@/components/tenant-loading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTenant } from "@/contexts/tenant-context";
import { getRedirectPath } from "@/lib/auth-redirect";
import { useIsAdmin } from "@/lib/permissions";
import { trpc } from "@/utils/trpc";

export default function DashboardPage() {
  const router = useRouter();
  const { tenant, role, isLoading } = useTenant();
  const isAdmin = useIsAdmin();

  const { data: stats, isLoading: statsLoading } = useQuery({
    ...trpc.tenant.getTenantStats.queryOptions(),
    enabled: !!tenant && !isAdmin,
  });

  // Se é admin, redirecionar para área admin
  useEffect(() => {
    if (role && !isLoading) {
      const redirectPath = getRedirectPath(role);
      if (redirectPath !== "/" && redirectPath !== "/dashboard") {
        router.push(redirectPath);
      }
    }
  }, [role, isLoading, router]);

  // Se está carregando, mostrar skeleton
  if (isLoading) {
    return <TenantDashboardSkeleton />;
  }

  // Se não tem tenant e não é admin, mostrar mensagem
  if (!(tenant || isAdmin)) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo!</CardTitle>
            <CardDescription>
              Você ainda não está associado a um tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Entre em contato com um administrador para ser adicionado a um
              tenant.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se é admin sem tenant, mostrar opção de ir para admin
  if (isAdmin && !tenant) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo!</CardTitle>
            <CardDescription>
              Você ainda não está associado a um tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-muted-foreground text-sm">
                Como administrador, você pode:
              </p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
                <li>Acessar a área de administração</li>
                <li>Criar novos tenants</li>
                <li>Gerenciar todos os tenants do sistema</li>
              </ul>
              <div className="mt-4">
                <a href="/admin">
                  <button
                    className="rounded-none bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/80"
                    type="button"
                  >
                    Ir para Área Admin
                  </button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se chegou aqui, tem tenant e pode mostrar o dashboard
  if (!tenant) {
    return null;
  }

  const isLoadingDashboard = isLoading || statsLoading;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h2 className="font-bold text-2xl">Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          Visão geral do seu tenant
        </p>
      </div>

      {isLoadingDashboard ? (
        <TenantDashboardSkeleton />
      ) : (
        <>
          {/* Cards de Métricas Principais */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total de Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {stats?.totalUsers ?? tenant._count?.users ?? 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  {stats?.usersByRole &&
                    Object.entries(stats.usersByRole)
                      .map(([role, count]) => `${role}: ${count}`)
                      .join(", ")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Filiais</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {stats?.totalBranches ?? 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  {stats?.activeBranches ?? 0} ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Status</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge
                  className={
                    tenant.active
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }
                  variant="outline"
                >
                  {tenant.active ? "Ativo" : "Inativo"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Informações Detalhadas */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Tenant</CardTitle>
                <CardDescription>Dados gerais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Nome:</span>
                  <span className="font-medium text-sm">{tenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Slug:</span>
                  <span className="font-medium text-sm">{tenant.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Criado em:
                  </span>
                  <span className="font-medium text-sm">
                    {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Usuários</CardTitle>
                <CardDescription>Por função</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.usersByRole &&
                Object.keys(stats.usersByRole).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(stats.usersByRole).map(([role, count]) => (
                      <div className="flex justify-between" key={role}>
                        <span className="text-muted-foreground text-sm">
                          {role}:
                        </span>
                        <span className="font-medium text-sm">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhum usuário encontrado
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
