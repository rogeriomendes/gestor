import { useTenant } from "@/contexts/tenant-context";

// Role type - será gerado pelo Prisma quando db:generate for executado
type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

/**
 * Hook para verificar se usuário tem uma role específica
 */
export function useHasRole(role: Role): boolean {
  const { role: userRole } = useTenant();
  return userRole === role;
}

/**
 * Hook para verificar se usuário tem uma das roles especificadas
 */
export function useHasAnyRole(roles: Role[]): boolean {
  const { role: userRole } = useTenant();
  return userRole ? roles.includes(userRole) : false;
}

/**
 * Hook para verificar se pode gerenciar tenant (TENANT_OWNER)
 */
export function useCanManageTenant(): boolean {
  return useHasRole("TENANT_OWNER");
}

/**
 * Hook para verificar se pode gerenciar usuários (TENANT_OWNER, TENANT_USER_MANAGER)
 */
export function useCanManageUsers(): boolean {
  return useHasAnyRole(["TENANT_OWNER", "TENANT_USER_MANAGER"]);
}

/**
 * Hook para verificar se é admin (SUPER_ADMIN, TENANT_ADMIN)
 */
export function useIsAdmin(): boolean {
  const { isTenantAdmin } = useTenant();
  return isTenantAdmin;
}

/**
 * Hook para verificar se é super admin
 */
export function useIsSuperAdmin(): boolean {
  const { isSuperAdmin } = useTenant();
  return isSuperAdmin;
}
