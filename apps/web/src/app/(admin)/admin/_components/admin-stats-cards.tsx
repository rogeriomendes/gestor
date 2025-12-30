"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

type AdminStatsCardsProps = {
  totalTenants: number;
  activeTenants: number;
};

export function AdminStatsCards({
  totalTenants,
  activeTenants,
}: AdminStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total de Tenants</CardTitle>
          <CardDescription>Tenants cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-2xl">{totalTenants}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenants Ativos</CardTitle>
          <CardDescription>Tenants com status ativo</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-2xl">{activeTenants}</p>
        </CardContent>
      </Card>
    </div>
  );
}
