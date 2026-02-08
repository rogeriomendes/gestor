import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

/** Tipo retornado pela listagem de empresas (select do banco gestor) */
export interface EmpresaListItem {
  ID: number;
  RAZAO_SOCIAL: string | null;
  NOME_FANTASIA: string | null;
  CNPJ: string | null;
}

const empresaListSelect = {
  ID: true,
  RAZAO_SOCIAL: true,
  NOME_FANTASIA: true,
  CNPJ: true,
} as const;

export const companiesRouter = router({
  all: tenantProcedure.query(
    async ({ ctx }): Promise<{ company: EmpresaListItem[] }> => {
      try {
        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const company = await gestorPrisma.empresa.findMany({
          select: empresaListSelect,
        });

        return { company: company as EmpresaListItem[] };
      } catch (error) {
        console.error("An error occurred when returning companys:", error);
        throw error;
      }
    }
  ),

  byId: tenantProcedure
    .input(
      z.object({
        id: z.number().optional(),
        cnpj: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id, cnpj } = input;

        if (!(id || cnpj)) {
          throw new Error(
            "É necessário fornecer pelo menos um dos parâmetros: id ou cnpj."
          );
        }

        const whereCondition = id ? { ID: id } : { CNPJ: cnpj };

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const company = await gestorPrisma.empresa.findMany({
          where: whereCondition,
          select: {
            ID: true,
            RAZAO_SOCIAL: true,
            NOME_FANTASIA: true,
            CNPJ: true,
          },
        });

        return { company: company[0] };
      } catch (error) {
        console.error("An error occurred when returning company name:", error);
        throw error;
      }
    }),
});
