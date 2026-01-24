import { useTenant } from "@/contexts/tenant-context";

// Role type - será gerado pelo Prisma quando db:generate for executado
type Role =
  | "SUPER_ADMIN"
  | "TENANT_ADMIN"
  | "TENANT_OWNER"
  | "TENANT_USER_MANAGER"
  | "TENANT_USER";

// Tipos de recursos e ações de permissão
// Separados por área: Admin e Tenant
export type PermissionResource =
  // Recursos da área Admin
  | "TENANT"
  | "USER"
  | "PLAN"
  | "SUBSCRIPTION"
  | "STATUS"
  | "AUDIT_LOG"
  // Recursos da área Tenant
  | "BRANCH"
  | "SETTINGS"
  | "DASHBOARD";

export type PermissionAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "MANAGE";

export type PermissionKey = `${PermissionResource}:${PermissionAction}`;

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

/**
 * Hook para verificar se o usuário tem uma permissão específica
 * @param resource - Recurso da permissão (ex: "USER", "TENANT")
 * @param action - Ação da permissão (ex: "CREATE", "READ", "UPDATE", "DELETE", "MANAGE")
 * @returns true se o usuário tem a permissão
 */
export function useHasPermission(
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const { permissions, isSuperAdmin, isLoading, role } = useTenant();

  // SUPER_ADMIN tem todas as permissões
  // Verificar também pela role diretamente caso isSuperAdmin ainda não esteja carregado
  if (isSuperAdmin || role === "SUPER_ADMIN") {
    return true;
  }

  // Durante o carregamento, retornar false para evitar mostrar conteúdo antes de verificar permissões
  if (isLoading) {
    return false;
  }

  if (!permissions) {
    return false;
  }

  const permissionKey: PermissionKey = `${resource}:${action}`;
  const manageKey: PermissionKey = `${resource}:MANAGE`;

  // Verificar permissão específica ou MANAGE (que dá acesso completo ao recurso)
  return permissions.has(permissionKey) || permissions.has(manageKey);
}

/**
 * Hook para verificar se o usuário tem qualquer uma das permissões especificadas (OR)
 * @param permissionsList - Array de permissões { resource, action }
 * @returns true se o usuário tem pelo menos uma das permissões
 */
export function useHasAnyPermission(
  permissionsList: Array<{
    resource: PermissionResource;
    action: PermissionAction;
  }>
): boolean {
  const { permissions, isSuperAdmin } = useTenant();

  if (isSuperAdmin) {
    return true;
  }

  if (!permissions) {
    return false;
  }

  return permissionsList.some((p) => {
    const permissionKey: PermissionKey = `${p.resource}:${p.action}`;
    const manageKey: PermissionKey = `${p.resource}:MANAGE`;
    return permissions.has(permissionKey) || permissions.has(manageKey);
  });
}

/**
 * Hook para verificar se o usuário tem todas as permissões especificadas (AND)
 * @param permissionsList - Array de permissões { resource, action }
 * @returns true se o usuário tem todas as permissões
 */
export function useHasAllPermissions(
  permissionsList: Array<{
    resource: PermissionResource;
    action: PermissionAction;
  }>
): boolean {
  const { permissions, isSuperAdmin } = useTenant();

  if (isSuperAdmin) {
    return true;
  }

  if (!permissions) {
    return false;
  }

  return permissionsList.every((p) => {
    const permissionKey: PermissionKey = `${p.resource}:${p.action}`;
    const manageKey: PermissionKey = `${p.resource}:MANAGE`;
    return permissions.has(permissionKey) || permissions.has(manageKey);
  });
}
