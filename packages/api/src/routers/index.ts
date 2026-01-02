import { protectedProcedure, publicProcedure, router } from "../index";

import { adminRouter } from "./admin";
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
  debug: debugRouter,
});

export type AppRouter = typeof appRouter;
