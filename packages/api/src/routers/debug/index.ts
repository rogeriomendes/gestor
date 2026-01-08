import { protectedProcedure, router } from "../../index";

export const debugRouter = router({
  /**
   * Endpoint de debug para verificar contexto do usuário
   */
  getMyContext: protectedProcedure.query(({ ctx }) => {
    return {
      userId: ctx.session?.user?.id,
      role: ctx.role,
      tenant: ctx.tenant,
      isSuperAdmin: ctx.isSuperAdmin,
      permissions: Array.from(ctx.permissions),
    };
  }),
});
