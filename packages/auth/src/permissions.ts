import { createAccessControl } from "better-auth/plugins/access";

/**
 * Definição de recursos/ações usadas pelo Admin plugin.
 * Baseado nas permissões padrão da doc:
 * https://www.better-auth.com/docs/plugins/admin#permissions
 *
 * user:    create | list | set-role | ban | impersonate | delete | set-password
 * session: list | revoke | delete
 */
const statement = {
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
  ],
  session: ["list", "revoke", "delete"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Mapear nossas roles de negócio para roles do Better Auth.
 * As chaves abaixo devem bater exatamente com o valor salvo em `user.role`.
 */
export const SUPER_ADMIN = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
  ],
  session: ["list", "revoke", "delete"],
});

export const TENANT_ADMIN = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
  ],
  session: ["list", "revoke", "delete"],
});

export const TENANT_OWNER = ac.newRole({
  user: ["create", "list", "set-role", "delete", "set-password"],
  session: ["list", "revoke"],
});

export const TENANT_USER_MANAGER = ac.newRole({
  user: ["list", "set-role", "set-password"],
  session: ["list"],
});

export const TENANT_USER = ac.newRole({
  user: ["list"],
});
