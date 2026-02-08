import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const supplierRouter = router({
  all: tenantProcedure.query(async ({ ctx }) => {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
      const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

      const supplier = await gestorPrisma.fornecedor.findMany({
        where: {
          pessoa: { FORNECEDOR: "S" },
        },
        select: {
          ID: true,
          pessoa: {
            select: {
              NOME: true,
              pessoa_juridica: { select: { CNPJ: true } },
            },
          },
        },
        orderBy: { pessoa: { NOME: "asc" } },
      });

      type Grouped = Record<string, { NOME: string; ID: number[] }>;
      const groupedSuppliers = supplier.reduce(
        (acc: Grouped, s: (typeof supplier)[number]) => {
          const name = s.pessoa.NOME;
          if (acc[name]) {
            acc[name].ID.push(s.ID);
          } else {
            acc[name] = { NOME: name, ID: [s.ID] };
          }
          return acc;
        },
        {} as Grouped
      );

      return { supplier: Object.values(groupedSuppliers) };
    } catch (error) {
      console.error("An error occurred when returning supplier name:", error);
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

        const supplier = await gestorPrisma.fornecedor.findUnique({
          where: { ID: Number(id) },
          select: {
            ID: true,
            pessoa: { select: { NOME: true } },
          },
        });

        return { supplier };
      } catch (error) {
        console.error("An error occurred when returning supplier name:", error);
        throw error;
      }
    }),
});
