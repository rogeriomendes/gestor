import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";
import { requireSuperAdmin, requireTenantAdmin } from "./middleware/roles";
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
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Procedure para operações de super admin
 */
export const superAdminProcedure = protectedProcedure.use(requireSuperAdmin());

/**
 * Procedure para operações de admin (super admin ou tenant admin)
 */
export const adminProcedure = protectedProcedure.use(requireTenantAdmin());

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
