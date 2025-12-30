// Role type - será gerado pelo Prisma quando db:generate for executado
type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

/**
 * Determina o caminho de redirecionamento baseado no role do usuário
 */
export function getRedirectPath(role: Role | null | undefined): string {
  if (!role) {
    return "/dashboard";
  }

  // SUPER_ADMIN e TENANT_ADMIN vão para área admin
  if (role === "SUPER_ADMIN" || role === "TENANT_ADMIN") {
    return "/admin";
  }

  // Outros roles vão para o dashboard do tenant
  return "/dashboard";
}
