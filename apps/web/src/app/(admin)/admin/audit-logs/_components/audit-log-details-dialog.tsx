"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAuditActionLabel,
  getAuditResourceTypeLabel,
} from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/date-utils";

interface AuditLogDetails {
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
  ipAddress?: string | null;
  metadata?: unknown;
}

interface AuditLogDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logDetails: AuditLogDetails | undefined;
  isLoading?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Skeleton className="mb-2 h-4 w-16" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-16" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-16" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-20" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-8" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <div>
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    </div>
  );
}

function LogDetailsContent({ logDetails }: { logDetails: AuditLogDetails }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-sm">Ação</p>
          <p className="font-medium">
            {getAuditActionLabel(logDetails.action)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Tipo de Recurso</p>
          <p className="font-medium">
            {getAuditResourceTypeLabel(logDetails.resourceType)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Usuário</p>
          <p className="font-medium">
            {logDetails.user?.name || "Desconhecido"} (
            {logDetails.user?.email || "N/A"})
          </p>
        </div>
        {logDetails.tenant && (
          <div>
            <p className="text-muted-foreground text-sm">Cliente</p>
            <p className="font-medium">{logDetails.tenant.name}</p>
          </div>
        )}
        <div>
          <p className="text-muted-foreground text-sm">Data/Hora</p>
          <p className="font-medium">{formatDateTime(logDetails.createdAt)}</p>
        </div>
        {logDetails.ipAddress && (
          <div>
            <p className="text-muted-foreground text-sm">IP</p>
            <p className="font-medium">{logDetails.ipAddress}</p>
          </div>
        )}
      </div>
      {logDetails.metadata !== undefined && logDetails.metadata !== null && (
        <div>
          <p className="mb-2 text-muted-foreground text-sm">Metadados</p>
          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-xs">
            {JSON.stringify(logDetails.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function AuditLogDetailsDialog({
  open,
  onOpenChange,
  logDetails,
  isLoading = false,
}: AuditLogDetailsDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Log</DialogTitle>
          <DialogDescription>
            Informações completas sobre esta ação
          </DialogDescription>
        </DialogHeader>
        {isLoading || !logDetails ? (
          <LoadingSkeleton />
        ) : (
          <LogDetailsContent logDetails={logDetails} />
        )}
      </DialogContent>
    </Dialog>
  );
}
