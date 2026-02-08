import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const accountRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { companyId } = input;

        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

        const accounts = await gestorPrisma.conta_caixa.findMany({
          where: {
            ID: { not: 2 },
            ...whereCompany,
          },
          select: {
            ID: true,
            ID_EMPRESA: true,
            NOME: true,
            DATA_ULTIMA_ABERTURA: true,
            HORA_ULTIMA_ABERTURA: true,
            STATUS_CAIXA_ABERTO: true,
          },
        });

        return { accounts };
      } catch (error) {
        console.error("An error occurred when returning accounts name:", error);
        throw error;
      }
    }),

  byId: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1).nullish(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id, companyId } = input;

        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

        const account = await gestorPrisma.conta_caixa.findUnique({
          where: {
            ID: Number(id),
            ...whereCompany,
          },
          select: {
            ID: true,
            NOME: true,
            DATA_ULTIMA_ABERTURA: true,
            HORA_ULTIMA_ABERTURA: true,
            STATUS_CAIXA_ABERTO: true,
          },
        });

        return { account };
      } catch (error) {
        console.error("An error occurred when returning account name:", error);
        throw error;
      }
    }),
});
