import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const receiptTypeRouter = router({
  byId: tenantProcedure
    .input(z.object({ id: z.number().min(1).nullish() }))
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

        const receiptType = await gestorPrisma.fin_tipo_recebimento.findUnique({
          where: { ID: Number(id) },
          select: { ID: true, DESCRICAO: true, TIPO: true },
        });

        return { receiptType };
      } catch (error) {
        console.error(
          "An error occurred when returning receipt type name:",
          error
        );
        throw error;
      }
    }),
});
