"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import { getBudgetSituationInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";

interface BudgetCardProps {
  budget: {
    ID: number;
    ID_EMPRESA: number;
    vendedor?: { colaborador?: { pessoa?: { NOME: string } } };
    cliente: { pessoa: { NOME: string } };
    VALOR_TOTAL: number;
    SITUACAO?: string;
    ALTERACAO_DATA_HORA?: string;
    OBSERVACAO?: string;
  };
  /** Nome da empresa (RAZAO_SOCIAL) para exibir no card, como no company-selector */
  companyName?: string | null;
  onClick?: (budget: any) => void;
}

export function BudgetCard({ budget, companyName, onClick }: BudgetCardProps) {
  const situationInfo = getBudgetSituationInfo(budget.SITUACAO);
  const isInProgress = budget.SITUACAO === "D";

  return (
    <Card
      className={cn(
        "h-full cursor-pointer rounded-md transition-all",
        isInProgress &&
          "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20"
      )}
      onClick={() => onClick?.(budget)}
      size="sm"
    >
      <CardContent>
        {/* Header com ID e situação */}
        <div className="mb-2 flex items-center justify-between font-medium text-sm leading-tight">
          <h3 className="flex flex-row items-center font-medium text-sm leading-tight">
            Orçamento #{budget.ID}
          </h3>
          <Badge
            className={cn(situationInfo.color, "px-1.5 py-0.5 text-xs")}
            variant={situationInfo.variant}
          >
            {situationInfo.label}
          </Badge>
        </div>

        {/* Empresa e cliente */}
        {companyName && (
          <div className="mb-1 flex flex-wrap items-center text-muted-foreground text-xs">
            <span>Empresa: {companyName}</span>
          </div>
        )}
        <div className="mb-1 flex flex-wrap items-center gap-x-2 text-muted-foreground text-xs">
          Cliente:{" "}
          <span className="truncate">{budget.cliente.pessoa.NOME}</span>
        </div>

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Vendedor */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Vendedor</span>
            <div className="truncate font-medium">
              {budget.vendedor?.colaborador?.pessoa?.NOME || "-"}
            </div>
          </div>

          {/* Data de alteração */}
          <div className="space-y-1">
            {budget.ALTERACAO_DATA_HORA && (
              <>
                <span className="text-muted-foreground">Alteração</span>
                <div className="truncate font-medium">
                  {formatDate(new Date(budget.ALTERACAO_DATA_HORA))}
                </div>
              </>
            )}
          </div>

          {/* Valor total */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Valor</span>
            <div className="font-semibold">
              {formatAsCurrency(Number(budget.VALOR_TOTAL))}
            </div>
          </div>

          {/* Observação (se houver) */}
          {budget.OBSERVACAO && (
            <div className="col-span-3 space-y-1">
              <span className="text-muted-foreground">Observação</span>
              <div className="line-clamp-2 text-blue-600 text-xs">
                {budget.OBSERVACAO}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
