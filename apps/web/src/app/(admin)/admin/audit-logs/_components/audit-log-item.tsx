"use client";

import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<string, string> = {
  CREATE_TENANT: "Criar Cliente",
  UPDATE_TENANT: "Atualizar Cliente",
  DELETE_TENANT: "Deletar Cliente",
  RESTORE_TENANT: "Restaurar Cliente",
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
  CREATE_PLAN: "Criar Plano",
  UPDATE_PLAN: "Atualizar Plano",
  DELETE_PLAN: "Deletar Plano",
  ACTIVATE_PLAN: "Ativar Plano",
  DEACTIVATE_PLAN: "Desativar Plano",
  CREATE_SUBSCRIPTION: "Criar Assinatura",
  UPDATE_SUBSCRIPTION: "Atualizar Assinatura",
  CANCEL_SUBSCRIPTION: "Cancelar Assinatura",
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  TENANT: "Cliente",
  USER: "Usuário",
  TENANT_USER: "Usuário do Cliente",
  BRANCH: "Filial",
  PERMISSION: "Permissão",
  PLAN: "Plano",
  SUBSCRIPTION: "Assinatura",
};

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
    <div
      className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-accent"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {ACTION_LABELS[log.action] || log.action}
            </Badge>
            <Badge variant="secondary">
              {RESOURCE_TYPE_LABELS[log.resourceType] || log.resourceType}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-4 text-muted-foreground text-sm">
            <span>Por: {log.user?.name || "Usuário desconhecido"}</span>
            {log.tenant && <span>Cliente: {log.tenant.name}</span>}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(log.createdAt).toLocaleString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
