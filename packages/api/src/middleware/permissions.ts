import prisma from "@gestor/db";
import type { Role } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import type { Context } from "../context";

// Cache de permissões por role (para performance em requisições que não passam pelo context)
const permissionCache = new Map<string, Set<string>>();

/**
 * Limpar cache de permissões (chamar quando permissões forem atualizadas)
 */
export function clearPermissionCache() {
  permissionCache.clear();
}

/**
 * Obter todas as permissões de uma role (com cache)
 * Usado apenas quando as permissões não estão no contexto
 */
async function getRolePermissions(role: Role): Promise<Set<string>> {
  const cacheKey = role;

  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey) as Set<string>;
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
 * Pode usar permissões do contexto ou buscar do cache/banco
 */
export async function hasPermission(
  role: Role | null,
  resource: string,
  action: string,
  contextPermissions?: Set<string>
): Promise<boolean> {
  if (!role) {
    return false;
  }

  // SUPER_ADMIN tem todas as permissões
  if (role === "SUPER_ADMIN") {
    return true;
  }

  // Usar permissões do contexto se disponíveis
  const permissions = contextPermissions || (await getRolePermissions(role));
  const permissionKey = `${resource}:${action}`;

  // Verificar permissão específica ou MANAGE (que dá acesso completo)
  return (
    permissions.has(permissionKey) || permissions.has(`${resource}:MANAGE`)
  );
}

/**
 * Verificar se o contexto tem uma permissão específica
 * Usa as permissões já carregadas no contexto
 */
export function contextHasPermission(
  ctx: Context,
  resource: string,
  action: string
): boolean {
  if (!ctx.role) {
    return false;
  }

  // SUPER_ADMIN tem todas as permissões
  if (ctx.isSuperAdmin) {
    return true;
  }

  // Verificar se permissions existe no contexto
  if (!ctx.permissions) {
    return false;
  }

  const permissionKey = `${resource}:${action}`;

  // Verificar permissão específica ou MANAGE (que dá acesso completo)
  return (
    ctx.permissions.has(permissionKey) ||
    ctx.permissions.has(`${resource}:MANAGE`)
  );
}

/**
 * Middleware para verificar permissão específica
 */
export function requirePermission(resource: string, action: string) {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    if (!ctx.role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Usuário não possui uma role válida",
      });
    }

    const hasAccess = contextHasPermission(ctx, resource, action);

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Permissão negada: ${resource}:${action}`,
      });
    }

    return next({ ctx });
  };
}

/**
 * Middleware para verificar múltiplas permissões (OR - qualquer uma)
 */
export function requireAnyPermission(
  permissions: Array<{ resource: string; action: string }>
) {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    if (!ctx.role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Usuário não possui uma role válida",
      });
    }

    // Verificar se tem pelo menos uma permissão
    const hasAccess = permissions.some((p) =>
      contextHasPermission(ctx, p.resource, p.action)
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Permissão negada",
      });
    }

    return next({ ctx });
  };
}

/**
 * Middleware para verificar todas as permissões (AND - todas)
 */
export function requireAllPermissions(
  permissions: Array<{ resource: string; action: string }>
) {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    if (!ctx.role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Usuário não possui uma role válida",
      });
    }

    // Verificar se tem todas as permissões
    const hasAccess = permissions.every((p) =>
      contextHasPermission(ctx, p.resource, p.action)
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Permissão negada",
      });
    }

    return next({ ctx });
  };
}
