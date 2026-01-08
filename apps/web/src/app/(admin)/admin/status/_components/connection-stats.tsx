"use client";

import { useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export function ConnectionStats() {
  const { data: stats, isLoading } = useQuery({
    ...trpc.admin.status.getConnectionStats.queryOptions(),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Estatísticas de Conexões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm">Total de Conexões</p>
            <p className="font-bold text-2xl">{stats.total}</p>
            <p className="text-muted-foreground text-xs">
              Máximo: {stats.maxSize}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Por Banco</p>
            <div className="mt-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">Gestor:</span>{" "}
                {stats.byDatabase.gestor}
              </p>
              <p className="text-sm">
                <span className="font-medium">DFE:</span> {stats.byDatabase.dfe}
              </p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Por Tenant</p>
            <p className="text-sm">
              {Object.keys(stats.byTenant).length} tenant(s) ativo(s)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
