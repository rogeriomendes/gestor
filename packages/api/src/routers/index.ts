import { protectedProcedure, publicProcedure, router } from "../index";

import { adminRouter } from "./admin";
import { auditRouter } from "./admin/audit";
import { permissionRouter } from "./admin/permission";
import { debugRouter } from "./debug";
import { tenantRouter } from "./tenant";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "Este é um dado privado",
      user: ctx.session.user,
    };
  }),
  admin: adminRouter,
  tenant: tenantRouter,
  audit: auditRouter, // Mantido na raiz para compatibilidade com código existente
  permission: permissionRouter, // Mantido na raiz para compatibilidade com código existente
  debug: debugRouter,
});

export type AppRouter = typeof appRouter;
