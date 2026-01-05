/**
 * Labels para logs de auditoria
 */

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE_TENANT: "Criar Cliente",
  UPDATE_TENANT: "Atualizar Cliente",
  DELETE_TENANT: "Deletar Cliente",
  RESTORE_TENANT: "Restaurar Cliente",
  CREATE_USER: "Criar Usuário",
  UPDATE_USER: "Atualizar Usuário",
  UPDATE_USER_ROLE: "Atualizar Função",
  DELETE_USER: "Deletar Usuário",
  RESTORE_USER: "Restaurar Usuário",
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

export const AUDIT_RESOURCE_TYPE_LABELS: Record<string, string> = {
  TENANT: "Cliente",
  USER: "Usuário",
  TENANT_USER: "Usuário do Cliente",
  BRANCH: "Filial",
  PERMISSION: "Permissão",
  PLAN: "Plano",
  SUBSCRIPTION: "Assinatura",
};

/**
 * Obtém o label de uma ação de auditoria
 * @param action - A ação de auditoria
 * @returns O label da ação de auditoria
 */
export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] || action;
}

/**
 * Obtém o label de um tipo de recurso de auditoria
 * @param resourceType - O tipo de recurso de auditoria
 * @returns O label do tipo de recurso de auditoria
 */
export function getAuditResourceTypeLabel(resourceType: string): string {
  return AUDIT_RESOURCE_TYPE_LABELS[resourceType] || resourceType;
}
