"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Building2, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { AdminGuard } from "@/components/admin";
import { PageLayout } from "@/components/layouts/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { trpc } from "@/utils/trpc";

function AdminPageContent() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    ...trpc.admin.getStats.queryOptions(),
  });

  const isLoading = statsLoading;

  return (
    <PageLayout
      actions={
        <Link href="/admin/tenants">
          <Button>Gerenciar Tenants</Button>
        </Link>
      }
      breadcrumbs={[{ label: "Admin" }]}
      subtitle="Visão geral do sistema e métricas principais"
      title="Área Administrativa"
    >
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total de Tenants
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats?.tenants.total ?? 0}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>
                +{stats?.tenants.newLast30Days ?? 0} nos últimos 30 dias
              </span>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">
                {stats?.tenants.active ?? 0} ativos
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-red-600">
                {stats?.tenants.inactive ?? 0} inativos
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total de Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats?.users.total ?? 0}</div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <TrendingUp className="h-3 w-3" />
              <span>
                +{stats?.users.newLast30Days ?? 0} nos últimos 30 dias
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Informações Detalhadas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tenants Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tenants Recentes</CardTitle>
                <CardDescription>Últimos tenants criados</CardDescription>
              </div>
              <Link href="/admin/tenants">
                <Button size="sm" variant="ghost">
                  Ver todos
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton count={3} itemHeight="h-20" />
            ) : (
              (() => {
                const hasTenants =
                  stats?.recentTenants && stats.recentTenants.length > 0;
                if (!hasTenants) {
                  return (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>Nenhum tenant encontrado</EmptyTitle>
                        <EmptyDescription>
                          Ainda não há tenants cadastrados no sistema.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  );
                }
                return (
                  <div className="space-y-4">
                    {stats.recentTenants.map(
                      (tenant: {
                        id: string;
                        name: string;
                        slug: string;
                        active: boolean;
                        _count: { users: number; branches: number };
                      }) => (
                        <Link
                          className="block rounded-md border p-3 transition-colors hover:bg-accent"
                          href={`/admin/tenants/${tenant.id}`}
                          key={tenant.id}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{tenant.name}</p>
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
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {tenant.slug}
                              </p>
                              <div className="mt-1 flex gap-4 text-muted-foreground text-xs">
                                <span>{tenant._count.users} usuários</span>
                                <span>{tenant._count.branches} filiais</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>

        {/* Usuários Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuários Recentes</CardTitle>
                <CardDescription>Últimos usuários cadastrados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ListSkeleton count={3} itemHeight="h-20" />
            ) : (
              (() => {
                const hasUsers =
                  stats?.recentUsers && stats.recentUsers.length > 0;
                if (!hasUsers) {
                  return (
                    <Empty>
                      <EmptyHeader>
                        <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
                        <EmptyDescription>
                          Ainda não há usuários cadastrados no sistema.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  );
                }
                return (
                  <div className="space-y-4">
                    {stats.recentUsers.map((user) => (
                      <div
                        className="flex items-center justify-between rounded-md border p-3"
                        key={user.id}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.name}</p>
                            {user.role && (
                              <Badge variant="outline">{user.role}</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {user.email}
                          </p>
                          {user.tenant && (
                            <p className="text-muted-foreground text-xs">
                              {user.tenant.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <AdminPageContent />
    </AdminGuard>
  );
}
