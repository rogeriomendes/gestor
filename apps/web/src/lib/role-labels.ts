/**
 * Labels e configurações centralizadas para roles
 */

export type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

/**
 * Labels das roles em português
 */
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Admin de Cliente",
  TENANT_OWNER: "Proprietário",
  TENANT_USER_MANAGER: "Gerente de Usuários",
  TENANT_USER: "Usuário",
};

/**
 * Labels das roles com contexto de cliente (para uso em filtros e listagens)
 */
export const ROLE_LABELS_WITH_CONTEXT: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Admin de Cliente",
  TENANT_OWNER: "Proprietário do Cliente",
  TENANT_USER_MANAGER: "Gerente de Usuários do Cliente",
  TENANT_USER: "Usuário do Cliente",
};

/**
 * Configuração de badges para roles (cores e estilos)
 */
export const ROLE_BADGE_CONFIG: Record<
  Role,
  { label: string; className: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    className:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  TENANT_ADMIN: {
    label: "Admin de Cliente",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  TENANT_OWNER: {
    label: "Proprietário",
    className:
      "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  TENANT_USER_MANAGER: {
    label: "Gerente de Usuários",
    className:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  TENANT_USER: {
    label: "Usuário",
    className:
      "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  },
};

/**
 * Obtém o label de uma role
 * @param role - A role
 * @param withContext - Se true, retorna o label com contexto de cliente
 * @returns O label da role
 */
export function getRoleLabel(
  role: Role | string | null | undefined,
  withContext = false
): string {
  if (!role) {
    return "Sem role";
  }
  const labels = withContext ? ROLE_LABELS_WITH_CONTEXT : ROLE_LABELS;
  return labels[role as Role] || role;
}

/**
 * Lista de roles disponíveis (exceto SUPER_ADMIN que é especial)
 */
export const TENANT_ROLES: Role[] = [
  "TENANT_ADMIN",
  "TENANT_OWNER",
  "TENANT_USER_MANAGER",
  "TENANT_USER",
];

/**
 * Lista de roles que podem ser criadas no admin
 */
export const ADMIN_CREATABLE_ROLES: Role[] = ["SUPER_ADMIN", "TENANT_ADMIN"];
