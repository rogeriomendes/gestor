"use client";

import { Package, PackageCheck, PackageX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlansStatsCardsProps {
  activePlans: number;
  inactivePlans: number;
  totalPlans: number;
  totalSubscriptions: number;
}

export function PlansStatsCards({
  totalPlans,
  activePlans,
  inactivePlans,
  totalSubscriptions,
}: PlansStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="rounded-md" size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Total de Planos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{totalPlans}</div>
          <p className="text-muted-foreground text-xs">
            Planos cadastrados no sistema
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-md" size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Planos Ativos</CardTitle>
          <PackageCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{activePlans}</div>
          <p className="text-muted-foreground text-xs">
            {totalPlans > 0
              ? `${Math.round((activePlans / totalPlans) * 100)}% do total`
              : "Nenhum plano"}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-md" size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Planos Inativos</CardTitle>
          <PackageX className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{inactivePlans}</div>
          <p className="text-muted-foreground text-xs">
            {totalPlans > 0
              ? `${Math.round((inactivePlans / totalPlans) * 100)}% do total`
              : "Nenhum plano"}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-md" size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Total de Assinaturas
          </CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{totalSubscriptions}</div>
          <p className="text-muted-foreground text-xs">
            Assinaturas ativas no sistema
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
