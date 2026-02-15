"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/format-date";
import { getPayStatusBySituation, getPayStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";

type BillsPayItem =
  RouterOutputs["tenant"]["financialBillsPay"]["all"]["financialBills"][number];

interface PayCardProps {
  bills: BillsPayItem;
  isSelected?: boolean;
  onSelect?: (billsId: number, value: number, checked: boolean) => void;
  onClick?: (bills: BillsPayItem) => void;
}

export function PayCard({
  bills,
  isSelected,
  onSelect,
  onClick,
}: PayCardProps) {
  const fornecedor =
    bills.fin_lancamento_pagar.fornecedor?.pessoa?.NOME ||
    "Fornecedor não informado";
  const nfe = bills.fin_lancamento_pagar.nfe_cabecalho?.NUMERO;
  const historico = bills.fin_lancamento_pagar.HISTORICO;

  // Status da conta via util
  // Se a situação for quitado (2), exibir "Quitado", senão usar data de vencimento
  const statusInfo =
    bills.fin_status_parcela?.SITUACAO === "2"
      ? getPayStatusBySituation(bills.fin_status_parcela?.SITUACAO)
      : bills.DATA_VENCIMENTO
        ? getPayStatusInfo(new Date(bills.DATA_VENCIMENTO))
        : getPayStatusBySituation("0");

  const handleCheckboxChange = (checked: boolean) => {
    onSelect?.(bills.ID, Number(bills.VALOR), checked);
  };

  return (
    <Card
      className={`h-full cursor-pointer rounded-md transition-all ${
        isSelected && "border-primary/20 bg-primary/5"
      }`}
      onClick={() => onClick?.(bills)}
      size="sm"
    >
      <CardContent>
        {/* Header com checkbox e status */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Checkbox
              checked={isSelected}
              className="h-4 w-4"
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
            />
            <h3 className="truncate font-medium text-sm leading-tight">
              {fornecedor}
            </h3>
          </div>
          <Badge
            className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
            variant={statusInfo.variant}
          >
            {statusInfo.label}
          </Badge>
        </div>

        {/* Empresa - nome como no company-selector; API retorna empresa em fin_lancamento_pagar */}
        {bills.fin_lancamento_pagar?.empresa?.RAZAO_SOCIAL && (
          <div className="mb-2 text-muted-foreground text-xs">
            Empresa: {bills.fin_lancamento_pagar.empresa.RAZAO_SOCIAL}
          </div>
        )}

        {/* Data de vencimento */}
        <div className="mb-3 text-muted-foreground text-xs">
          Vencimento:{" "}
          {bills.DATA_VENCIMENTO && formatDate(new Date(bills.DATA_VENCIMENTO))}
        </div>

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Valor */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Valor</span>
            <div className="font-medium">
              {formatAsCurrency(Number(bills.VALOR))}
            </div>
          </div>

          {/* Parcela */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Parcela</span>
            <div className="font-medium">
              {bills.NUMERO_PARCELA}/{bills.parcelasCount}
            </div>
          </div>

          {/* NFe (se houver) */}
          {nfe && (
            <div className="space-y-1">
              <span className="text-muted-foreground">NFe</span>
              <div className="font-medium">{nfe}</div>
            </div>
          )}

          {/* Histórico (se houver) */}
          {historico && (
            <div className="col-span-2 space-y-1">
              <span className="text-muted-foreground">Histórico</span>
              <div className="truncate font-medium text-xs">
                {/* {historico.includes(
                  "Lançamento a Pagar gerado pela Entrada de Nota Fiscal ID",
                )
                  ? "Gerado pela Entrada de Nota"
                  : historico} */}
                {historico}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
