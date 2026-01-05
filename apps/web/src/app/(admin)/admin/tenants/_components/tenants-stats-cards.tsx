"use client";

import { Building2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TenantsStatsCardsProps {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  deletedTenants: number;
}

export function TenantsStatsCards({
  totalTenants,
  activeTenants,
  inactiveTenants,
  deletedTenants,
}: TenantsStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Total de Clientes
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{totalTenants}</div>
          <p className="text-muted-foreground text-xs">
            Clientes cadastrados no sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Clientes Ativos</CardTitle>
          <Building2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{activeTenants}</div>
          <p className="text-muted-foreground text-xs">
            {totalTenants > 0
              ? `${Math.round((activeTenants / totalTenants) * 100)}% do total`
              : "Nenhum cliente"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Clientes Inativos
          </CardTitle>
          <Building2 className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{inactiveTenants}</div>
          <p className="text-muted-foreground text-xs">
            {totalTenants > 0
              ? `${Math.round((inactiveTenants / totalTenants) * 100)}% do total`
              : "Nenhum cliente"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Clientes Deletados
          </CardTitle>
          <Trash2 className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{deletedTenants}</div>
          <p className="text-muted-foreground text-xs">Podem ser restaurados</p>
        </CardContent>
      </Card>
    </div>
  );
}
