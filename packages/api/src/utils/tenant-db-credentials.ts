import type { Tenant } from "@gestor/db/types";

/**
 * Verifica se o tenant possui credenciais completas de banco de dados
 * @param tenant - Objeto Tenant
 * @returns true se todas as credenciais necessárias estão preenchidas
 */
export function hasCompleteDatabaseCredentials(
  tenant: Tenant | null | undefined
): boolean {
  if (!tenant) {
    return false;
  }

  return !!(
    tenant.dbHost &&
    tenant.dbPort &&
    tenant.dbUsername &&
    tenant.dbPassword
  );
}
