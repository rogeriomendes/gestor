import prisma from "@gestor/db";
import type { Role } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import type { Context } from "../context";

// Cache de permissões por role (para performance)
const permissionCache = new Map<string, Set<string>>();

/**
 * Limpar cache de permissões (chamar quando permissões forem atualizadas)
 */
export function clearPermissionCache() {
  permissionCache.clear();
}

/**
 * Obter todas as permissões de uma role (com cache)
 */
async function getRolePermissions(role: Role): Promise<Set<string>> {
  const cacheKey = role;

  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey)!;
  }

  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      role,
      granted: true,
    },
    include: {
      permission: true,
    },
  });

  const permissions = new Set(
    rolePermissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`
    )
  );

  permissionCache.set(cacheKey, permissions);
  return permissions;
}

/**
 * Verificar se uma role tem uma permissão específica
 */
export async function hasPermission(
  role: Role | null,
  resource: string,
  action: string
): Promise<boolean> {
  if (!role) {
    return false;
  }

  // SUPER_ADMIN tem todas as permissões
  if (role === "SUPER_ADMIN") {
    return true;
  }

  const permissions = await getRolePermissions(role);
  const permissionKey = `${resource}:${action}`;

  // Verificar permissão específica ou MANAGE (que dá acesso completo)
  return (
    permissions.has(permissionKey) || permissions.has(`${resource}:MANAGE`)
  );
}

/**
 * Middleware para verificar permissão específica
 */
export function requirePermission(resource: string, action: string) {
  return async ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!ctx.role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User role is required",
      });
    }

    const hasAccess = await hasPermission(ctx.role, resource, action);

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Permission denied: ${resource}:${action}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        role: ctx.role,
      },
    });
  };
}

/**
 * Middleware para verificar múltiplas permissões (OR - qualquer uma)
 */
export function requireAnyPermission(
  permissions: Array<{ resource: string; action: string }>
) {
  return async ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!ctx.role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User role is required",
      });
    }

    // Verificar se tem pelo menos uma permissão
    const hasAccess = await Promise.all(
      permissions.map((p) => hasPermission(ctx.role!, p.resource, p.action))
    ).then((results) => results.some((result) => result === true));

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Permission denied",
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        role: ctx.role,
      },
    });
  };
}
