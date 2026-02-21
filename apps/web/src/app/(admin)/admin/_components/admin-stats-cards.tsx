"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AdminStatsCardsProps {
  activeTenants: number;
  totalTenants: number;
}

export function AdminStatsCards({
  totalTenants,
  activeTenants,
}: AdminStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="rounded-md transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Total de Clientes</CardTitle>
          <CardDescription className="text-xs">
            Clientes cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-3xl tracking-tight">{totalTenants}</p>
        </CardContent>
      </Card>

      <Card className="rounded-md transition-all duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Clientes Ativos</CardTitle>
          <CardDescription className="text-xs">
            Clientes com status ativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-bold text-3xl tracking-tight">{activeTenants}</p>
        </CardContent>
      </Card>
    </div>
  );
}
