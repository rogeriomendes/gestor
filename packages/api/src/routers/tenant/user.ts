import type { Tenant } from "@gestor/db/types";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const userRouter = router({
  all: tenantProcedure.query(async ({ ctx }) => {
    const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

    const usersRaw = await gestorPrisma.usuario.findMany({
      where: { LOGIN: { not: null }, ID: { not: 1 } },
      select: { LOGIN: true },
      distinct: ["LOGIN"],
      orderBy: [{ LOGIN: "asc" }],
    });

    const users = usersRaw
      .map((item) => item.LOGIN?.trim())
      .filter((value): value is string => !!value && value.length > 0);

    return { users };
  }),
});
