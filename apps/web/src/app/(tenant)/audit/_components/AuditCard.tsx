"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import type { RouterOutputs } from "@/utils/trpc";

type AuditItem = RouterOutputs["tenant"]["audit"]["all"]["audit"][number];

interface AuditCardProps {
  audit: AuditItem;
  onClick?: (item: AuditItem) => void;
}

export function AuditCard({ audit, onClick }: AuditCardProps) {
  return (
    <Card
      className="h-full cursor-pointer rounded-md transition-all data-[size=sm]:py-2"
      onClick={() => onClick?.(audit)}
      size="sm"
    >
      <CardContent className="space-y-2 group-data-[size=sm]/card:px-2">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate font-medium text-sm">
            {audit.RESUMO || audit.ACAO || "Sem resumo"}
          </p>
          <Badge variant="secondary">{audit.ID}</Badge>
        </div>

        <div className="space-y-1 text-muted-foreground text-xs">
          <div className="flex items-center gap-1">
            <p className="truncate">
              Usuário: {audit.usuario?.LOGIN || audit.NOME_USU_AUTO || "—"}
            </p>
            <span>•</span>
            <p>
              Data:{" "}
              {audit.DATA_REGISTRO
                ? `${formatDate(audit.DATA_REGISTRO)} ${audit.HORA_REGISTRO || ""}`.trim()
                : "—"}
            </p>
          </div>
          <p className="truncate">Tela: {audit.JANELA_CONTROLLER || "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
