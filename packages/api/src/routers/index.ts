import { protectedProcedure, publicProcedure, router } from "../index";

import { adminRouter } from "./admin";
import { auditRouter } from "./audit";
import { debugRouter } from "./debug";
import { permissionRouter } from "./permission";
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
  permission: permissionRouter,
  audit: auditRouter,
  debug: debugRouter,
});

export type AppRouter = typeof appRouter;
