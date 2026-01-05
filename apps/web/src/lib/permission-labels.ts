/**
 * Labels centralizados para permissões
 */

/**
 * Labels para ações de permissões
 */
export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  CREATE: "Criar",
  READ: "Visualizar",
  UPDATE: "Editar",
  DELETE: "Deletar",
  MANAGE: "Gerenciar (Tudo)",
};

/**
 * Labels para recursos de permissões
 */
export const PERMISSION_RESOURCE_LABELS: Record<string, string> = {
  TENANT: "Clientes",
  USER: "Usuários",
  BRANCH: "Filiais",
  SETTINGS: "Configurações",
  DASHBOARD: "Dashboard",
  AUDIT_LOG: "Logs de Auditoria",
};

/**
 * Obtém o label de uma ação de permissão
 * @param action - A ação de permissão
 * @returns O label da ação
 */
export function getPermissionActionLabel(action: string): string {
  return PERMISSION_ACTION_LABELS[action] || action;
}

/**
 * Obtém o label de um recurso de permissão
 * @param resource - O recurso de permissão
 * @returns O label do recurso
 */
export function getPermissionResourceLabel(resource: string): string {
  return PERMISSION_RESOURCE_LABELS[resource] || resource;
}
