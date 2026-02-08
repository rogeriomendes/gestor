"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import { getSaleStatusInfo } from "@/lib/status-info";
import { cn } from "@/lib/utils";

interface SaleCardProps {
  sale: {
    ID: number;
    ID_EMPRESA: number;
    NOME_REAJUSTE: string;
    DATA_INICIO: string | null;
    HORA_INICIO: string | null;
    DATA_FIM: string | null;
    HORA_FIM: string | null;
    DATA_CADASTRO: string | null;
    OBSERVACAO: string | null;
    STATUS: string;
  };
  onClick?: (sale: any) => void;
}

export function SaleCard({ sale, onClick }: SaleCardProps) {
  const statusInfo = getSaleStatusInfo(sale.STATUS);
  const isActive = sale.STATUS === "E";
  const isAwaiting = sale.STATUS === "A";

  return (
    <Card
      className={cn(
        "h-full cursor-pointer rounded-md transition-all",
        isActive && "border-primary/20 bg-primary/5",
        isAwaiting &&
          "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
      )}
      onClick={() => onClick?.(sale)}
    >
      <CardContent>
        {/* Header com nome e status */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="line-clamp-2 font-medium text-sm leading-tight">
            {sale.NOME_REAJUSTE}
          </h3>
          <Badge
            className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
            variant={statusInfo.variant}
          >
            {statusInfo.label}
          </Badge>
        </div>

        {/* Empresa */}
        {/* <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span>Empresa: {sale.ID_EMPRESA}</span>
        </div> */}

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Data de início */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Início</span>
            <div className="font-medium">
              {sale.DATA_INICIO && (
                <>
                  {formatDate(new Date(sale.DATA_INICIO), true)}
                  {sale.HORA_INICIO && (
                    <span className="ml-1">{sale.HORA_INICIO}</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Data de fim */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Fim</span>
            <div className="font-medium">
              {sale.DATA_FIM && (
                <>
                  {formatDate(new Date(sale.DATA_FIM), true)}
                  {sale.HORA_FIM && (
                    <span className="ml-1">{sale.HORA_FIM}</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Data de cadastro */}
          {/* <div className="space-y-1">
            <span className="text-muted-foreground">Cadastro</span>
            <div className="font-medium">
              {sale.DATA_CADASTRO ? formatDate(new Date(sale.DATA_CADASTRO), true) : "-"}
            </div>
          </div> */}

          {/* Observação (se houver) */}
          {sale.OBSERVACAO !== null && sale.OBSERVACAO.length > 2 && (
            <div className="col-span-2 space-y-1">
              <span className="text-muted-foreground">Observação</span>
              <div className="line-clamp-2 text-xs">{sale.OBSERVACAO}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
