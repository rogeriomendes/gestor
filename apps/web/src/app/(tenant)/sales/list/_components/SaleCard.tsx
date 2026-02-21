"use client";

import { DotIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getNfceStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency, removeLeadingZero } from "@/lib/utils";

interface SaleCardProps {
  /** Nome da empresa (RAZAO_SOCIAL) para exibir no card, como no company-selector */
  companyName?: string | null;
  onClick?: (sale: any) => void;
  sale: {
    ID: number;
    ID_EMPRESA: number;
    NUMERO_NFE?: number;
    SERIE_NFE?: number;
    conta_caixa?: { NOME: string };
    cliente?: { pessoa?: { NOME: string } };
    DATA_VENDA?: string;
    HORA_SAIDA?: string;
    VALOR_TOTAL: number;
    DEVOLUCAO?: string;
    CANCELADO_ID_USUARIO?: number;
    OBSERVACAO?: string;
    nfe_cabecalho?: Array<{ STATUS_NOTA: string }>;
  };
}

export function SaleCard({ sale, companyName, onClick }: SaleCardProps) {
  const statusInfo = getNfceStatusInfo({
    devolucao: sale.DEVOLUCAO,
    canceladoIdUsuario: sale.CANCELADO_ID_USUARIO,
    nfeStatus: sale.nfe_cabecalho?.[0]?.STATUS_NOTA ?? null,
  });
  const isCanceled = sale.DEVOLUCAO === "S" || sale.CANCELADO_ID_USUARIO;

  return (
    <Card
      className={cn(
        "h-full cursor-pointer rounded-md transition-all",
        isCanceled &&
          "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
      )}
      onClick={() => onClick?.(sale)}
      size="sm"
    >
      <CardContent>
        {/* Header com número da venda e status */}
        <div className="mb-2 flex items-center justify-between font-medium text-sm leading-tight">
          <h3 className="flex flex-row items-center font-medium text-sm leading-tight">
            {sale.ID}
            {sale.NUMERO_NFE && (
              <>
                <DotIcon /> NFCe {removeLeadingZero(String(sale.NUMERO_NFE))}
              </>
            )}
          </h3>
          <Badge
            className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
            variant={statusInfo.variant}
          >
            {statusInfo.label}
          </Badge>
        </div>

        {/* Informações de identificação */}
        {companyName && (
          <div className="mb-0.5 flex flex-wrap items-center text-muted-foreground text-xs">
            <span>Empresa: {companyName}</span>
          </div>
        )}
        <div className="mb-0.5 flex flex-wrap items-center gap-x-1 text-muted-foreground text-xs">
          {sale.conta_caixa?.NOME && <>Conta: {sale.conta_caixa?.NOME}</>}
          {sale.conta_caixa?.NOME && sale.cliente?.pessoa?.NOME && <DotIcon />}
          {sale.cliente?.pessoa?.NOME && (
            <>Cliente: {sale.cliente?.pessoa?.NOME}</>
          )}
        </div>

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Data da venda */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Data</span>
            <div className="font-medium">
              {sale.DATA_VENDA && (
                <>
                  {new Date(sale.DATA_VENDA).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}
                  {sale.HORA_SAIDA && (
                    <span className="ml-1">{sale.HORA_SAIDA}</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Valor total */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Valor</span>
            <div className={cn("font-semibold", isCanceled && "text-red-500")}>
              {formatAsCurrency(Number(sale.VALOR_TOTAL))}
            </div>
          </div>

          {/* Observação (se houver) */}
          {sale.OBSERVACAO && (
            <div className="col-span-2 space-y-1">
              <span className="text-muted-foreground">Observação</span>
              <div className="line-clamp-2 text-blue-600 text-xs">
                {sale.OBSERVACAO}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
