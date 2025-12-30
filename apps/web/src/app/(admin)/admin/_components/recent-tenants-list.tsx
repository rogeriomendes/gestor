"use client";

import { TenantListSkeleton } from "@/components/tenant-loading";
import { Badge } from "@/components/ui/badge";
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

type Tenant = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

type RecentTenantsListProps = {
  tenants: Tenant[];
  isLoading: boolean;
};

export function RecentTenantsList({
  tenants,
  isLoading,
}: RecentTenantsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenants Recentes</CardTitle>
        <CardDescription>Últimos tenants criados</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TenantListSkeleton />
        ) : tenants.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nenhum tenant encontrado</EmptyTitle>
              <EmptyDescription>
                Ainda não há tenants cadastrados no sistema.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-4">
            {tenants.slice(0, 5).map((tenant) => (
              <div
                className="flex items-center justify-between border-b pb-4 last:border-0"
                key={tenant.id}
              >
                <div>
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-muted-foreground text-sm">{tenant.slug}</p>
                </div>
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
