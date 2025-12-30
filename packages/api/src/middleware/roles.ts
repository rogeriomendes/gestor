import type { Role } from "@gestor/db/types";
import { TRPCError } from "@trpc/server";
import type { Context } from "../context";

/**
 * Verifica se o usuário tem uma role específica
 */
export function requireRole(role: Role) {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (ctx.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires the ${role} role`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        role: ctx.role as Role,
      },
    });
  };
}

/**
 * Verifica se o usuário tem uma das roles especificadas
 */
export function requireAnyRole(roles: Role[]) {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!(ctx.role && roles.includes(ctx.role))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires one of the following roles: ${roles.join(", ")}`,
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
 * Verifica se o usuário é super admin
 */
export function requireSuperAdmin() {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!ctx.isSuperAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This action requires SUPER_ADMIN role",
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
 * Verifica se o usuário é tenant admin ou super admin
 */
export function requireTenantAdmin() {
  return ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!ctx.isTenantAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This action requires TENANT_ADMIN or SUPER_ADMIN role",
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
