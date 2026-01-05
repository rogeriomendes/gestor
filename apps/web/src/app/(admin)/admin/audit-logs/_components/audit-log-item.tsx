"use client";

import { Button } from "@base-ui/react/button";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getAuditActionLabel,
  getAuditResourceTypeLabel,
} from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/date-utils";

interface AuditLogItemProps {
  log: {
    id: string;
    action: string;
    resourceType: string;
    createdAt: Date | string;
    user?: {
      name: string | null;
      email: string;
    } | null;
    tenant?: {
      name: string;
    } | null;
  };
  onClick: () => void;
}

export function AuditLogItem({ log, onClick }: AuditLogItemProps) {
  return (
    <Button
      className="w-full cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getAuditActionLabel(log.action)}</Badge>
            <Badge variant="secondary">
              {getAuditResourceTypeLabel(log.resourceType)}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
            <span>Por: {log.user?.name || "Usuário desconhecido"}</span>
            {log.tenant && <span>Cliente: {log.tenant.name}</span>}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateTime(log.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Button>
  );
}
