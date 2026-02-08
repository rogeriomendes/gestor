"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import { getFinancialClosingStatusInfo } from "@/lib/status-info";
import { cn } from "@/lib/utils";

interface FinancialClosingCardProps {
  item: {
    type: "open" | "closed";
    data: any;
  };
  onClick?: (item: any) => void;
}

export function FinancialClosingCard({
  item,
  onClick,
}: FinancialClosingCardProps) {
  const { type, data } = item;
  const statusInfo = getFinancialClosingStatusInfo(type);
  if (type === "open") {
    // Conta aberta
    return (
      <Card
        className="h-full cursor-pointer rounded-md border-primary/20 bg-primary/5 transition-all"
        onClick={() => onClick?.(item)}
      >
        <CardContent>
          {/* Header com status e empresa */}
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium text-sm leading-tight">{data.NOME}</h3>
            <Badge
              className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
              variant={statusInfo.variant}
            >
              {statusInfo.label}
            </Badge>
          </div>

          {/* Empresa */}
          {/* <div className="flex items-center text-xs text-muted-foreground mb-3">
            <span>Empresa: {data.ID_EMPRESA}</span>
          </div> */}

          {/* Informações principais em grid compacto */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Data de abertura */}
            <div className="space-y-1">
              <span className="text-muted-foreground">Abertura</span>
              <div className="font-medium">
                {data.DATA_ULTIMA_ABERTURA && (
                  <>
                    {formatDate(data.DATA_ULTIMA_ABERTURA)}
                    {data.HORA_ULTIMA_ABERTURA && (
                      <span className="ml-1">{data.HORA_ULTIMA_ABERTURA}</span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <span className="text-muted-foreground">Status</span>
              <div className="font-medium text-primary">Em uso</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  // Fechamento
  return (
    <Card
      className="h-full cursor-pointer rounded-md transition-all"
      onClick={() => onClick?.(item)}
    >
      <CardContent>
        {/* Header com nome e status */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium text-sm leading-tight">
            {data.conta_caixa?.NOME}
          </h3>
          <Badge
            className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
            variant={statusInfo.variant}
          >
            {statusInfo.label}
          </Badge>
        </div>

        {/* Empresa */}
        {/* <div className="flex items-center text-xs text-muted-foreground mb-3">
            <span>Empresa: {data.conta_caixa?.ID_EMPRESA}</span>
          </div> */}

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Data de abertura */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Abertura</span>
            <div className="font-medium">
              {data.DATA_ABERTURA && (
                <>
                  {formatDate(data.DATA_ABERTURA)}
                  {data.HORA_ABERTURA && (
                    <span className="ml-1">{data.HORA_ABERTURA}</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Data de fechamento */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Fechamento</span>
            <div className="font-medium">
              {data.DATA_FECHAMENTO && (
                <>
                  {formatDate(data.DATA_FECHAMENTO)}
                  {data.HORA_FECHAMENTO && (
                    <span className="ml-1">{data.HORA_FECHAMENTO}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
