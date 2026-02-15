"use client";

import { CheckCircle2, Clock, XCircle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionsStatsCardsProps {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  expiredSubscriptions: number;
  cancelledSubscriptions: number;
}

export function SubscriptionsStatsCards({
  totalSubscriptions,
  activeSubscriptions,
  trialSubscriptions,
  expiredSubscriptions,
  cancelledSubscriptions,
}: SubscriptionsStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      <Card className="rounded-md" size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Total de Assinaturas
          </CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{totalSubscriptions}</div>
          <p className="text-muted-foreground text-xs">
            Assinaturas cadastradas
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-md" size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">
            Assinaturas Ativas
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{activeSubscriptions}</div>
          <p className="text-muted-foreground text-xs">
            {totalSubscriptions > 0
              ? `${Math.round((activeSubscriptions / totalSubscriptions) * 100)}% do total`
              : "Nenhuma assinatura"}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-md" size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Em Trial</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{trialSubscriptions}</div>
          <p className="text-muted-foreground text-xs">Período de teste</p>
        </CardContent>
      </Card>

      <Card className="rounded-md" size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Expiradas</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{expiredSubscriptions}</div>
          <p className="text-muted-foreground text-xs">Assinaturas vencidas</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">Canceladas</CardTitle>
          <XCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="font-bold text-2xl">{cancelledSubscriptions}</div>
          <p className="text-muted-foreground text-xs">
            Assinaturas canceladas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
