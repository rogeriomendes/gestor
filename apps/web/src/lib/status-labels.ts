/**
 * Labels centralizados para status
 */

/**
 * Labels para status de ativação (ativo/inativo)
 */
export const ACTIVATION_STATUS_LABELS: Record<string, string> = {
  all: "Todos",
  active: "Ativos",
  inactive: "Inativos",
};

/**
 * Labels para status de assinatura
 */
export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  // all: "Todos",
  active: "Ativas",
  cancelled: "Canceladas",
  expired: "Expiradas",
  trial: "Em Trial",
};

/**
 * Labels para status de planos
 */
export const PLAN_STATUS_LABELS: Record<string, string> = {
  all: "Todos",
  active: "Ativos",
  inactive: "Inativos",
};

/**
 * Obtém o label de status de ativação
 * @param status - O status
 * @returns O label do status
 */
export function getActivationStatusLabel(status: string): string {
  return ACTIVATION_STATUS_LABELS[status] || status;
}

/**
 * Obtém o label de status de assinatura
 * @param status - O status
 * @returns O label do status
 */
export function getSubscriptionStatusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABELS[status] || status;
}

/**
 * Obtém o label de status de plano
 * @param status - O status
 * @returns O label do status
 */
export function getPlanStatusLabel(status: string): string {
  return PLAN_STATUS_LABELS[status] || status;
}
