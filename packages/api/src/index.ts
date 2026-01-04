import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";
import { requireSuperAdmin } from "./middleware/roles";
import { requireActiveTenant, requireTenant } from "./middleware/tenant";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx,
  });
});

/**
 * Procedure para operações de super admin (apenas SUPER_ADMIN)
 */
export const superAdminProcedure = protectedProcedure.use(requireSuperAdmin());

/**
 * Procedure para operações de admin
 * Permite SUPER_ADMIN ou usuários com permissões adequadas
 * As permissões específicas devem ser verificadas em cada rota
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (!ctx.role) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Usuário não possui uma role válida",
    });
  }

  return next({
    ctx,
  });
});

/**
 * Procedure para operações que requerem tenant
 */
export const tenantProcedure = protectedProcedure.use(requireTenant());

/**
 * Procedure para operações que requerem tenant ativo
 */
export const activeTenantProcedure = protectedProcedure.use(
  requireActiveTenant()
);
