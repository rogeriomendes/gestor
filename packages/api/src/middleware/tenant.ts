import { TRPCError } from "@trpc/server";
import type { Context } from "../context";

/**
 * Verifica se o usuário tem um tenant associado
 * SUPER_ADMIN e TENANT_ADMIN não precisam de tenant
 */
export function requireTenant() {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // SUPER_ADMIN e TENANT_ADMIN não precisam de tenant
    if (ctx.isSuperAdmin || ctx.isTenantAdmin) {
      return next({
        ctx: {
          ...ctx,
          session: ctx.session,
          tenant: ctx.tenant,
          role: ctx.role,
        },
      });
    }

    // Outros roles precisam de tenant
    if (!ctx.tenant) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User must be associated with a tenant",
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        tenant: ctx.tenant,
        role: ctx.role,
      },
    });
  };
}

/**
 * Verifica se o usuário tem um tenant ativo
 * SUPER_ADMIN e TENANT_ADMIN não precisam de tenant
 */
export function requireActiveTenant() {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    // SUPER_ADMIN e TENANT_ADMIN não precisam de tenant
    if (ctx.isSuperAdmin || ctx.isTenantAdmin) {
      return next({
        ctx: {
          ...ctx,
          session: ctx.session,
          tenant: ctx.tenant,
          role: ctx.role,
        },
      });
    }

    // Outros roles precisam de tenant ativo
    if (!ctx.tenant) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User must be associated with a tenant",
      });
    }

    if (!ctx.tenant.active) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Tenant is not active",
      });
    }

    if (ctx.tenant.deletedAt) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Tenant has been deleted",
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        tenant: ctx.tenant,
        role: ctx.role,
      },
    });
  };
}
