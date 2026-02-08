import type { Tenant } from "@gestor/db/types";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import {
  getDfePrismaClient,
  getGestorPrismaClient,
} from "../../utils/tenant-db-clients";

export const invoiceDfeRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        company: z.string().nullish(),
        supplier: z.union([z.string(), z.array(z.string())]).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { company, supplier } = input;

        const whereCompany =
          company && company !== "0" ? { CNPJ_EMPRESA: company } : {};
        const whereSupplier =
          supplier && supplier !== "0"
            ? {
                RAZAO_SOCIAL: Array.isArray(supplier)
                  ? { in: supplier }
                  : supplier,
              }
            : {};

        const where = {
          NFE_FOI_IMPORTADA: "N",
          ...whereCompany,
          ...whereSupplier,
        };

        const dfePrisma = getDfePrismaClient(ctx.tenant as Tenant);
        const invoiceDfe = await dfePrisma.dfe.findMany({
          where,
          select: {
            CNPJ_EMPRESA: true,
            CHAVE_ACESSO: true,
            NUMERO: true,
            CNPJ_CPF: true,
            RAZAO_SOCIAL: true,
            EMISSAO: true,
            VALOR: true,
            DOCXML: true,
          },
          orderBy: [{ EMISSAO: "desc" }],
        });

        return { invoiceDfe };
      } catch (error) {
        console.error("An error occurred when returning dfe invoice:", error);
        throw error;
      }
    }),

  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        const dfePrisma = getDfePrismaClient(ctx.tenant as Tenant);
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

        const invoiceDfe = await dfePrisma.dfe.findMany({
          where: { CHAVE_ACESSO: id },
          select: {
            CNPJ_EMPRESA: true,
            CHAVE_ACESSO: true,
            NUMERO: true,
            CNPJ_CPF: true,
            RAZAO_SOCIAL: true,
            EMISSAO: true,
            VALOR: true,
            DOCXML: true,
          },
        });

        const empresaCnpjs = invoiceDfe
          .map((dfe: { CNPJ_EMPRESA: string | null }) => dfe.CNPJ_EMPRESA)
          .filter(
            (cnpj): cnpj is string => cnpj !== null && cnpj !== undefined
          );

        const empresas =
          empresaCnpjs.length > 0
            ? await gestorPrisma.empresa.findMany({
                where: { CNPJ: { in: empresaCnpjs } },
                select: {
                  ID: true,
                  CNPJ: true,
                  RAZAO_SOCIAL: true,
                  NOME_FANTASIA: true,
                },
              })
            : [];

        const empresaMap = new Map(empresas.map((e) => [e.CNPJ, e]));

        const invoiceDfeWithEmpresa = invoiceDfe.map((dfe) => ({
          ...dfe,
          empresa: dfe.CNPJ_EMPRESA
            ? (empresaMap.get(dfe.CNPJ_EMPRESA) ?? null)
            : null,
        }));

        return { invoiceDfe: invoiceDfeWithEmpresa };
      } catch (error) {
        console.error("An error occurred when returning dfe invoice:", error);
        throw error;
      }
    }),

  hide: tenantProcedure
    .input(
      z.object({
        chaveAcesso: z.string(),
        cnpjEmpresa: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { chaveAcesso, cnpjEmpresa } = input;

        const dfePrisma = getDfePrismaClient(ctx.tenant as Tenant);
        const updatedDfe = await dfePrisma.dfe.update({
          where: {
            CNPJ_EMPRESA_CHAVE_ACESSO: {
              CNPJ_EMPRESA: cnpjEmpresa,
              CHAVE_ACESSO: chaveAcesso,
            },
          },
          data: { NFE_FOI_IMPORTADA: "S" },
        });

        return { success: true, dfe: updatedDfe };
      } catch (error) {
        console.error("An error occurred when hiding dfe:", error);
        throw error;
      }
    }),
});
