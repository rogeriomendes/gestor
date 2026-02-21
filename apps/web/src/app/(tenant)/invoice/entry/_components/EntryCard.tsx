"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import { formatAsCurrency } from "@/lib/utils";

interface EntryCardProps {
  /** Nome da empresa (RAZAO_SOCIAL) para exibir no card, como no company-selector */
  companyName?: string | null;
  entry: {
    ID: number;
    ID_EMPRESA: number;
    VALOR_TOTAL: number;
    DATA_ENTRADA_SAIDA?: string;
    HORA_ENTRADA_SAIDA?: string;
    DATA_EMISSAO?: string;
    NUMERO?: string;
    fornecedor?: { pessoa: { NOME: string } };
  };
  onClick?: (entry: any) => void;
}

export function EntryCard({ entry, companyName, onClick }: EntryCardProps) {
  const fornecedor =
    entry.fornecedor?.pessoa?.NOME || "Fornecedor não informado";
  const numeroNfe = entry.NUMERO;
  const dataEntrada = entry.DATA_ENTRADA_SAIDA;
  const horaEntrada = entry.HORA_ENTRADA_SAIDA;
  const dataEmissao = entry.DATA_EMISSAO;

  return (
    <Card
      className="h-full cursor-pointer rounded-md transition-all"
      onClick={() => onClick?.(entry)}
      size="sm"
    >
      <CardContent>
        {/* Header com fornecedor e status */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="min-w-0 flex-1 truncate font-medium text-sm leading-tight">
            {fornecedor}
          </h3>
        </div>

        {companyName && (
          <div className="mb-2 text-muted-foreground text-xs">
            Empresa: {companyName}
          </div>
        )}

        {/* Data de entrada */}
        <div className="mb-3 text-muted-foreground text-xs">
          Entrada: {dataEntrada && formatDate(new Date(dataEntrada))}
          {horaEntrada && ` ${horaEntrada}`}
        </div>

        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Valor total */}
          <div className="space-y-1">
            <span className="text-muted-foreground">Valor Total</span>
            <div className="font-medium">
              {formatAsCurrency(Number(entry.VALOR_TOTAL))}
            </div>
          </div>

          {/* Número NFe */}
          <div className="space-y-1">
            <span className="text-muted-foreground">NFe</span>
            <div className="font-medium">{numeroNfe || "-"}</div>
          </div>

          {/* Data de emissão (se houver) */}
          {dataEmissao && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Emissão</span>
              <div className="font-medium">
                {formatDate(new Date(dataEmissao))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
