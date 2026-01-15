"use client";

import { useQuery } from "@tanstack/react-query";
import { Cpu, Database, HardDrive, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export function ServerStatusCards() {
  const { data: status, isLoading } = useQuery({
    ...trpc.admin.status.getServerStatus.queryOptions(),
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86_400);
    const hours = Math.floor((seconds % 86_400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getMemoryBarColor = (percent: number) => {
    if (percent > 80) {
      return "bg-red-500";
    }
    if (percent > 60) {
      return "bg-yellow-500";
    }
    return "bg-green-500";
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Uso de Memória */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Uso de Memória</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {status.memory.heapUsedPercent.toFixed(1)}%
          </div>
          <p className="text-muted-foreground text-xs">
            {status.memory.heapUsedMB.toFixed(0)} MB /{" "}
            {status.memory.heapTotalMB.toFixed(0)} MB
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full transition-all ${getMemoryBarColor(
                status.memory.heapUsedPercent
              )}`}
              style={{ width: `${status.memory.heapUsedPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* CPU */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">CPU</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {status.cpu.percent.toFixed(1)}%
          </div>
          <p className="text-muted-foreground text-xs">
            Load: {status.loadAverage[0].toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Conexões de Banco */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Conexões Ativas</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {status.pools.gestor.active + status.pools.dfe.active}
          </div>
          <p className="text-muted-foreground text-xs">
            Gestor: {status.pools.gestor.active} | DFE:{" "}
            {status.pools.dfe.active}
          </p>
        </CardContent>
      </Card>

      {/* Uptime */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Uptime</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">
            {formatUptime(status.uptime)}
          </div>
          <p className="text-muted-foreground text-xs">
            Node {status.nodeVersion} | {status.platform}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
