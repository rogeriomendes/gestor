import type { Role } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import type { Context } from "../context";

/**
 * @deprecated Use requirePermission instead. This function is kept for backward compatibility.
 * Verifica se o usuário tem uma role específica
 */
export function requireRole(role: Role) {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    if (ctx.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Esta ação requer a role ${role}`,
      });
    }

    return next({ ctx });
  };
}

/**
 * @deprecated Use requirePermission or requireAnyPermission instead.
 * Verifica se o usuário tem uma das roles especificadas
 */
export function requireAnyRole(roles: Role[]) {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    if (!(ctx.role && roles.includes(ctx.role))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Esta ação requer uma das seguintes roles: ${roles.join(", ")}`,
      });
    }

    return next({ ctx });
  };
}

/**
 * Verifica se o usuário é super admin
 * SUPER_ADMIN sempre tem todas as permissões
 */
export function requireSuperAdmin() {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    if (!ctx.isSuperAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Esta ação requer permissão de SUPER_ADMIN",
      });
    }

    return next({ ctx });
  };
}

/**
 * @deprecated Use requirePermission instead.
 * Verifica se o usuário é tenant admin ou super admin
 */
export function requireTenantAdmin() {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    // SUPER_ADMIN sempre tem acesso
    if (ctx.isSuperAdmin) {
      return next({ ctx });
    }

    // Para outros, verificar se tem role válida
    if (!ctx.role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Usuário não possui uma role válida",
      });
    }

    return next({ ctx });
  };
}
