import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const clientRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        searchTerm: z.string().nullish(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { searchTerm, companyId } = input;

        const whereSearch = searchTerm && {
          OR: [{ pessoa: { NOME: { contains: searchTerm } } }],
        };

        const whereCompany =
          companyId && companyId !== 0
            ? {
                venda_cabecalho: {
                  some: { ID_EMPRESA: companyId },
                },
              }
            : {};

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

        const client = await gestorPrisma.cliente.findMany({
          where: {
            ID: { not: 1 },
            ATIVO: "S",
            ...whereSearch,
            ...whereCompany,
          },
          select: {
            ID: true,
            pessoa: {
              select: { NOME: true },
            },
          },
          orderBy: { pessoa: { NOME: "asc" } },
        });

        return { client };
      } catch (error) {
        console.error("An error occurred when returning client name:", error);
        throw error;
      }
    }),

  byId: tenantProcedure
    .input(z.object({ id: z.number().int().min(1).optional() }))
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;
        if (!id) {
          return { client: null };
        }

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

        const client = await gestorPrisma.cliente.findUnique({
          where: { ID: id },
          select: {
            ID: true,
            pessoa: { select: { NOME: true } },
          },
        });

        return { client };
      } catch (error) {
        console.error("An error occurred when returning client name:", error);
        throw error;
      }
    }),
});
