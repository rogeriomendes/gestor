"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import { getReceiveStatusById } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";

type ReceiveItem =
  RouterOutputs["tenant"]["financialBillsReceive"]["all"]["receive"][number];

interface ReceiveCardProps {
  receive: ReceiveItem;
  onClick?: (receive: ReceiveItem) => void;
}

export function ReceiveCard({ receive, onClick }: ReceiveCardProps) {
  const lancamento = receive.fin_lancamento_receber;
  const venda = lancamento.venda_cabecalho;
  const cliente =
    venda?.cliente?.pessoa?.NOME ||
    lancamento.cliente?.pessoa?.NOME ||
    "Cliente não informado";
  const contaCaixa = venda?.conta_caixa?.NOME;

  // Valores
  const valorAReceber = lancamento.VALOR_A_RECEBER;
  const valorRestante = lancamento.VALOR_RESTANTE;

  // Status do recebimento usando ID_FIN_STATUS_PARCELA
  const statusInfo = getReceiveStatusById(receive.ID_FIN_STATUS_PARCELA);

  return (
    <Card
      className="h-full cursor-pointer rounded-md transition-all"
      onClick={() => onClick?.(receive)}
      size="sm"
    >
      <CardContent>
        {/* Header com data e status */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium text-sm leading-tight">
            <span className="truncate">{cliente}</span>
          </h3>
          <Badge
            className={cn("px-1.5 py-0.5 text-xs", statusInfo.color)}
            variant={statusInfo.variant}
          >
            {statusInfo.label}
          </Badge>
        </div>

        {/* Cliente */}
        <div className="mb-3 flex items-center text-muted-foreground text-xs">
          Data:{" "}
          {lancamento.DATA_LANCAMENTO &&
            formatDate(new Date(lancamento.DATA_LANCAMENTO))}
          {venda?.HORA_SAIDA && (
            <span className="ml-1 text-muted-foreground">
              {venda.HORA_SAIDA}
            </span>
          )}
        </div>

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          {/* Conta caixa */}
          <div className="col-span-2 space-y-1">
            <span className="text-muted-foreground">Conta Caixa</span>
            <div className="truncate font-medium">{contaCaixa}</div>
          </div>
          {/* Valor a receber */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Valor</span>
            <div
              className={cn(
                "font-medium",
                receive.ID_FIN_STATUS_PARCELA === 2 ||
                  (receive.ID_FIN_STATUS_PARCELA === 3 && "line-through")
              )}
            >
              {formatAsCurrency(valorAReceber)}
            </div>
          </div>
          {/* Valor restante */}
          {receive.ID_FIN_STATUS_PARCELA === 3 && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Restante</span>
              <div className="font-medium">
                {formatAsCurrency(valorRestante)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
