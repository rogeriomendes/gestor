"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Gauge, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc, trpcClient } from "@/utils/trpc";

type HealthLevel = "warming" | "good" | "warning" | "critical";

function getContextCacheHealth(stats: {
  averageBuildTimeMs: number;
  builds: number;
  hitRate: number;
  hits: number;
  misses: number;
}): { hint: string; level: HealthLevel; label: string } {
  const lookups = stats.hits + stats.misses;

  if (lookups < 10) {
    return {
      level: "warming",
      label: "Aquecendo",
      hint: "Poucas requisições ainda; o hit rate estabiliza após ~10 lookups.",
    };
  }

  let hitScore = 0;
  if (stats.hitRate < 0.35) {
    hitScore = 2;
  } else if (stats.hitRate < 0.65) {
    hitScore = 1;
  }

  let buildScore = 0;
  if (stats.builds >= 3) {
    if (stats.averageBuildTimeMs > 200) {
      buildScore = 2;
    } else if (stats.averageBuildTimeMs > 80) {
      buildScore = 1;
    }
  }

  const worst = Math.max(hitScore, buildScore);

  if (worst === 0) {
    return {
      level: "good",
      label: "Saudável",
      hint: "Hit rate dentro do esperado.",
      // hint: "Hit rate e tempo de build dentro do esperado.",
    };
  }
  if (worst === 1) {
    return {
      level: "warning",
      label: "Atenção",
      hint: "Hit rate baixo; verifique tráfego ou carga no banco.",
      // hint: "Hit rate baixo ou build lento; verifique tráfego ou carga no banco.",
    };
  }
  return {
    level: "critical",
    label: "Crítico",
    hint: "Cache quase não acerta; investigar uso e DB.",
    // hint: "Cache quase não acerta ou build muito lento; investigar uso e DB.",
  };
}

function healthBadgeClass(level: HealthLevel) {
  return {
    critical: cn(
      "border-red-500/35 bg-red-500/10 text-red-800 dark:text-red-300"
    ),
    good: cn(
      "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
    ),
    warming: cn("border-border bg-muted/60 text-muted-foreground"),
    warning: cn(
      "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
    ),
  }[level];
}

export function ContextCacheStats() {
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.admin.status.getContextCacheStats.queryOptions(),
    refetchInterval: 5000,
  });

  const clearContextCacheMutation = useMutation({
    mutationFn: () => trpcClient.admin.status.clearContextCache.mutateAsync(),
    onSuccess: (data) => {
      toast.success(`Cache de contexto limpo (${data.clearedCount} entradas).`);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao limpar cache de contexto.");
    },
  });

  if (isLoading) {
    return (
      <Card size="sm">
        <CardHeader>
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const health = getContextCacheHealth(stats);

  return (
    <Card size="sm">
      <ConfirmDialog
        cancelText="Cancelar"
        confirmText="Limpar cache"
        description={
          <span>
            Todas as entradas do cache de contexto serão removidas. As próximas
            requisições autenticadas reconstruirão permissões, cliente e
            assinatura a partir do banco, com possível aumento momentâneo de
            carga.
          </span>
        }
        isLoading={clearContextCacheMutation.isPending}
        onConfirm={() => clearContextCacheMutation.mutateAsync()}
        onOpenChange={setClearDialogOpen}
        open={clearDialogOpen}
        title="Limpar cache de contexto?"
        variant="destructive"
      />
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Gauge className="h-5 w-5" />
            <span>Cache de Contexto (API)</span>
            <Badge
              className={cn("font-medium", healthBadgeClass(health.level))}
              variant="outline"
            >
              {health.label}
            </Badge>
          </CardTitle>
          <Button
            disabled={clearContextCacheMutation.isPending}
            onClick={() => setClearDialogOpen(true)}
            size="sm"
            variant="outline"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                clearContextCacheMutation.isPending && "animate-spin"
              )}
            />
            Limpar cache
          </Button>
        </div>
        <p className="text-muted-foreground text-xs leading-snug">
          {health.hint}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-muted-foreground text-sm">Hit Rate</p>
            <p className="font-bold text-2xl">
              {(stats.hitRate * 100).toFixed(1)}%
            </p>
            <p className="text-muted-foreground text-xs">
              Hits: {stats.hits} | Misses: {stats.misses}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-sm">Build médio</p>
            <p className="font-bold text-2xl">{stats.averageBuildTimeMs} ms</p>
            <p className="text-muted-foreground text-xs">
              Builds: {stats.builds}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-sm">Entradas</p>
            <p className="font-bold text-2xl">
              {stats.size} / {stats.max}
            </p>
            <p className="text-muted-foreground text-xs">
              TTL: {Math.round(stats.ttlMs / 1000)}s
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-sm">Invalidações</p>
            <p className="font-bold text-2xl">
              {stats.invalidationsUser + stats.invalidationsAll}
            </p>
            <p className="text-muted-foreground text-xs">
              Usuário: {stats.invalidationsUser} | Global:{" "}
              {stats.invalidationsAll}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
