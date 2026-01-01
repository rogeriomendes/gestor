"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACTION_LABELS: Record<string, string> = {
  CREATE_TENANT: "Criar Tenant",
  UPDATE_TENANT: "Atualizar Tenant",
  DELETE_TENANT: "Deletar Tenant",
  RESTORE_TENANT: "Restaurar Tenant",
  CREATE_USER: "Criar Usuário",
  UPDATE_USER: "Atualizar Usuário",
  UPDATE_USER_ROLE: "Atualizar Role",
  REMOVE_USER: "Remover Usuário",
  INVITE_USER: "Convidar Usuário",
  CREATE_BRANCH: "Criar Filial",
  UPDATE_BRANCH: "Atualizar Filial",
  DELETE_BRANCH: "Deletar Filial",
  RESTORE_BRANCH: "Restaurar Filial",
  UPDATE_PERMISSIONS: "Atualizar Permissões",
  INITIALIZE_PERMISSIONS: "Inicializar Permissões",
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  TENANT: "Tenant",
  USER: "Usuário",
  TENANT_USER: "Usuário do Tenant",
  BRANCH: "Filial",
  PERMISSION: "Permissão",
};

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
}

export function AuditLogDetailsDialog({
  open,
  onOpenChange,
  logDetails,
}: AuditLogDetailsDialogProps) {
  if (!logDetails) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Log</DialogTitle>
          <DialogDescription>
            Informações completas sobre esta ação
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm">Ação</p>
              <p className="font-medium">
                {ACTION_LABELS[logDetails.action] || logDetails.action}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Tipo de Recurso</p>
              <p className="font-medium">
                {RESOURCE_TYPE_LABELS[logDetails.resourceType] ||
                  logDetails.resourceType}
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
                <p className="text-muted-foreground text-sm">Tenant</p>
                <p className="font-medium">{logDetails.tenant.name}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-sm">Data/Hora</p>
              <p className="font-medium">
                {new Date(logDetails.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            {logDetails.ipAddress && (
              <div>
                <p className="text-muted-foreground text-sm">IP</p>
                <p className="font-medium">{logDetails.ipAddress}</p>
              </div>
            )}
          </div>
          {logDetails.metadata && (
            <div>
              <p className="mb-2 text-muted-foreground text-sm">Metadados</p>
              <pre className="max-h-64 overflow-auto rounded-md bg-muted p-4 text-xs">
                {JSON.stringify(logDetails.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
