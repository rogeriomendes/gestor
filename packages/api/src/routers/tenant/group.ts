import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const groupRouter = router({
  all: tenantProcedure.query(async ({ ctx }) => {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
      const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

      const group = await gestorPrisma.produto_sub_grupo.findMany({
        where: { INATIVO: "N" },
        select: { ID: true, NOME: true },
        orderBy: { NOME: "asc" },
      });

      return { group };
    } catch (error) {
      console.error("An error occurred when returning client name:", error);
      throw error;
    }
  }),

  byId: tenantProcedure
    .input(z.object({ id: z.number().min(1).nullish() }))
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

        const group = await gestorPrisma.produto_sub_grupo.findUnique({
          where: { ID: Number(id) },
          select: { ID: true, NOME: true },
        });

        return { group };
      } catch (error) {
        console.error("An error occurred when returning client name:", error);
        throw error;
      }
    }),
});
