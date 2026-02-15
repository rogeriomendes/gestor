"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getNfceStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";

type ReceiptItem =
  RouterOutputs["tenant"]["financialReceipt"]["all"]["receipts"][number];

interface FinancialReceiptCardProps {
  receipt: ReceiptItem;
  onClick?: (receipt: ReceiptItem) => void;
}

export function FinancialReceiptCard({
  receipt,
  onClick,
}: FinancialReceiptCardProps) {
  const venda = receipt?.venda_cabecalho;
  const cliente = venda?.cliente?.pessoa?.NOME || "Cliente não informado";
  const tipoPagamento =
    receipt?.fin_tipo_recebimento?.DESCRICAO || "Não informado";

  // Exibir sequência da forma de pagamento (ex: "1/2", "2/2")
  const sequencia = receipt?.SEQUENCIA_FORMA_PAGAMENTO || 1;
  const totalFormas = receipt?.TOTAL_FORMAS_PAGAMENTO || 1;
  const parcelaInfo = totalFormas > 1 ? `${sequencia}/${totalFormas}` : "1/1";

  // Status da venda
  const statusInfo = getNfceStatusInfo({
    devolucao: venda?.DEVOLUCAO,
    canceladoIdUsuario: venda?.CANCELADO_ID_USUARIO,
    nfeStatus: venda?.nfe_cabecalho?.[0]?.STATUS_NOTA ?? null,
  });

  const isCanceled = venda?.DEVOLUCAO === "S" || venda?.CANCELADO_ID_USUARIO;

  return (
    <Card
      className={cn(
        "h-full cursor-pointer rounded-md transition-all",
        isCanceled &&
          "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
      )}
      onClick={() => onClick?.(receipt)}
      size="sm"
    >
      <CardContent>
        {/* Header com valor e status */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium text-sm leading-tight">
            {venda?.HORA_SAIDA}
          </h3>
          <Badge
            className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
            variant={statusInfo.variant}
          >
            {statusInfo.label}
          </Badge>
        </div>

        {/* Cliente e hora */}
        <div className="mb-3 text-muted-foreground text-xs">
          <span className="truncate">Cliente: {cliente}</span>
          {/* {venda?.HORA_SAIDA && (
            <>
              <DotIcon className="size-3" />
              <ClockIcon className="size-3" />
              <span>{venda.HORA_SAIDA}</span>
            </>
          )} */}
        </div>

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Valor */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Vlr. Parcela</span>
            <div className="font-medium">
              {formatAsCurrency(Number(receipt.VALOR_RECEBIDO))}
            </div>
          </div>

          {/* Parcela */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Parcela</span>
            <div className="font-medium">{parcelaInfo}</div>
          </div>

          {/* Tipo de pagamento */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Tipo Pag.</span>
            <div className="truncate font-medium">{tipoPagamento}</div>
          </div>

          {/* NFCe (se houver) */}
          {/* {venda?.NFCE === "S" && venda?.NUMERO_NFE && (
            <div className="space-y-1 col-span-2">
              <span className="text-muted-foreground">NFCe</span>
              <div className="font-medium">
                {removeLeadingZero(String(venda.NUMERO_NFE))}
                {venda.SERIE_NFE && (
                  <span className="text-muted-foreground ml-1">
                    S.{venda.SERIE_NFE}
                  </span>
                )}
              </div>
            </div>
          )} */}
        </div>
      </CardContent>
    </Card>
  );
}
