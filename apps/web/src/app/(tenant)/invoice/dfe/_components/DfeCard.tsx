"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { decodeDocXml } from "@/lib/decode-doc-xml";
import { formatDate } from "@/lib/format-date";
import { getXmlStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { EyeOffIcon } from "lucide-react";

type DfeItem =
  RouterOutputs["tenant"]["invoiceDfe"]["all"]["invoiceDfe"][number];

interface DfeCardProps {
  dfe: DfeItem;
  /** Nome da empresa (RAZAO_SOCIAL) para exibir no card, como no company-selector */
  companyName?: string | null;
  onClick?: (dfe: DfeItem) => void;
  onHide?: (dfe: DfeItem) => void;
}

export function DfeCard({ dfe, companyName, onClick, onHide }: DfeCardProps) {
  const razaoSocial = dfe.RAZAO_SOCIAL || "Fornecedor não informado";
  const numeroNfe = dfe.NUMERO;
  const dataEmissao = dfe.EMISSAO;

  // Status do XML
  // const statusInfo = getXmlStatusInfo(
  //   dfe.DOCXML && new TextDecoder().decode(Uint8Array.from(dfe.DOCXML))
  // );

  const statusInfo = getXmlStatusInfo(
    dfe.DOCXML && decodeDocXml(dfe.DOCXML)
  );

  return (
    <Card
      className="h-full cursor-pointer rounded-md transition-all"
      onClick={(e) => {
        if (
          (e.target as HTMLElement).closest(
            "button, a[href], [role=button], input[type=checkbox], [role=checkbox], [data-dropdown-menu-trigger], [data-no-row-click]"
          )
        ) {
          return;
        }
        onClick?.(dfe);
      }}
      size="sm"
    >
      <CardContent>
        {/* Header com fornecedor e botão de ocultar */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="min-w-0 flex-1 cursor-pointer truncate font-medium text-sm uppercase leading-tight">
            {razaoSocial}
          </h3>
          <Badge
            className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
            variant={statusInfo.variant}
          >
            {statusInfo.label}
          </Badge>
        </div>

        {/* Empresa (destinatária) - nome como no company-selector */}
        {companyName && (
          <div className="mb-2 text-muted-foreground text-xs">
            Empresa: {companyName}
          </div>
        )}

        {/* Data de emissão */}
        <div className="mb-3 text-muted-foreground text-xs">
          Emissão: {dataEmissao && formatDate(new Date(dataEmissao))}
        </div>

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Valor total */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Valor Total</span>
            <div className="font-medium">
              {formatAsCurrency(Number(dfe.VALOR))}
            </div>
          </div>

          {/* Número NFe */}
          <div className="space-y-1">
            <span className="text-muted-foreground">NFe</span>
            <div className="font-medium">{numeroNfe}</div>
          </div>

          {/* Ocultar */}
          <div className="space-y-1">
            {/* <span className="text-muted-foreground">Ocultar Nota Fiscal</span> */}
            <Button
              className="gap-2 hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onHide?.(dfe);
              }}
              size="sm"
              variant="ghost"
            >
              <EyeOffIcon className="h-3 w-3" /> Ocultar Nota
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
