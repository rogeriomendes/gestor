"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdminStatsCardsProps {
  totalTenants: number;
  activeTenants: number;
}

export function AdminStatsCards({
  totalTenants,
  activeTenants,
}: AdminStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total de Clientes</CardTitle>
          <CardDescription>Clientes cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-2xl">{totalTenants}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Ativos</CardTitle>
          <CardDescription>Clientes com status ativo</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-2xl">{activeTenants}</p>
        </CardContent>
      </Card>
    </div>
  );
}
