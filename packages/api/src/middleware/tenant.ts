import { TRPCError } from "@trpc/server";
import type { Context } from "../context";

/**
 * Verifica se o usuário tem um tenant associado
 * SUPER_ADMIN não precisa de tenant (pode acessar qualquer tenant)
 */
export function requireTenant() {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    // SUPER_ADMIN não precisa de tenant (pode gerenciar qualquer tenant)
    if (ctx.isSuperAdmin) {
      return next({ ctx });
    }

    // Outros roles precisam de tenant
    if (!ctx.tenant) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Usuário deve estar associado a um cliente",
      });
    }

    return next({ ctx });
  };
}

/**
 * Verifica se o usuário tem um tenant ativo
 * SUPER_ADMIN não precisa de tenant (pode acessar qualquer tenant)
 */
export function requireActiveTenant() {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Autenticação necessária",
      });
    }

    // SUPER_ADMIN não precisa de tenant (pode gerenciar qualquer tenant)
    if (ctx.isSuperAdmin) {
      return next({ ctx });
    }

    // Outros roles precisam de tenant ativo
    if (!ctx.tenant) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Usuário deve estar associado a um cliente",
      });
    }

    if (!ctx.tenant.active) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cliente não está ativo",
      });
    }

    if (ctx.tenant.deletedAt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cliente foi deletado",
      });
    }

    return next({ ctx });
  };
}
