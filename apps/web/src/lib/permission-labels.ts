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
 * Separados por área: Admin e Tenant
 */
export const PERMISSION_RESOURCE_LABELS: Record<string, string> = {
  // Área Admin
  TENANT: "Clientes",
  USER: "Usuários",
  PLAN: "Planos",
  SUBSCRIPTION: "Assinaturas",
  STATUS: "Status do Sistema",
  AUDIT_LOG: "Logs de Auditoria",
  // Área Tenant
  BRANCH: "Filiais",
  SETTINGS: "Configurações",
  DASHBOARD: "Dashboard",
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
