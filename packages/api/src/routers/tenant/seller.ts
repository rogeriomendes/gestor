import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const sellerRouter = router({
  all: tenantProcedure.query(async ({ ctx }) => {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
      const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

      const sellers = await gestorPrisma.vendedor.findMany({
        where: {
          ATIVO: "S",
          ID_COLABORADOR: { not: 3 },
        },
        select: {
          ID: true,
          colaborador: {
            select: {
              pessoa: { select: { NOME: true } },
            },
          },
        },
      });

      return { sellers };
    } catch (error) {
      console.error("An error occurred when returning sellers name:", error);
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

        const seller = await gestorPrisma.vendedor.findUnique({
          where: { ID: Number(id) },
          select: {
            ID: true,
            colaborador: {
              select: {
                pessoa: { select: { NOME: true } },
              },
            },
          },
        });

        return { seller };
      } catch (error) {
        console.error("An error occurred when returning seller name:", error);
        throw error;
      }
    }),
});
