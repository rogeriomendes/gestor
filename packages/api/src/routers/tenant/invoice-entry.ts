import type { Tenant } from "@gestor/db/types";
import { format } from "date-fns";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const invoiceEntryRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        company: z.number().nullish(),
        supplier: z.union([z.number(), z.array(z.number())]).nullish(),
        date: z
          .object({
            from: z.coerce.date(),
            to: z.coerce.date().nullish(),
          })
          .nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input.limit ?? 30;
        const { cursor, company, supplier, date } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const whereSupplier = supplier &&
          supplier !== 0 && {
            ID_FORNECEDOR: Array.isArray(supplier)
              ? { in: supplier }
              : supplier,
          };

        const whereCompany = company &&
          company !== 0 && {
            ID_EMPRESA: company,
          };

        const whereDate = date
          ? {
              DATA_ENTRADA_SAIDA: {
                gte: new Date(format(date.from, "yyyy-MM-dd")),
                ...(date.to
                  ? { lte: new Date(format(date.to, "yyyy-MM-dd")) }
                  : {}),
              },
            }
          : {};

        const where = {
          NATUREZA_OPERACAO: "COMPRA",
          ...whereCompany,
          ...whereSupplier,
          ...whereDate,
        };

        const invoiceEntry = await gestorPrisma.nfe_cabecalho.findMany({
          take: limit + 1,
          cursor: cursor ? { ID: Number(cursor) } : undefined,
          where,
          select: {
            ID: true,
            ID_EMPRESA: true,
            NUMERO: true,
            DATA_EMISSAO: true,
            DATA_ENTRADA_SAIDA: true,
            HORA_ENTRADA_SAIDA: true,
            VALOR_TOTAL: true,
            fornecedor: {
              select: {
                pessoa: {
                  select: {
                    NOME: true,
                  },
                },
              },
            },
          },
          orderBy: [{ ID: "desc" }],
        });

        let nextCursor: typeof cursor | undefined;
        if (invoiceEntry.length > limit) {
          const nextInvoice = invoiceEntry.pop();
          nextCursor = String(nextInvoice?.ID ?? undefined);
        }

        return {
          invoiceEntry,
          nextCursor,
        };
      } catch (error) {
        console.error("An error occurred when returning entry invoice:", error);
        throw error;
      }
    }),

  byId: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const invoiceEntry = await gestorPrisma.nfe_cabecalho.findUnique({
          where: {
            ID: id,
          },
          select: {
            ID: true,
            ID_EMPRESA: true,
            ID_FORNECEDOR: true,
            CODIGO_NUMERICO: true,
            SERIE: true,
            NUMERO: true,
            DATA_EMISSAO: true,
            DATA_ENTRADA_SAIDA: true,
            HORA_ENTRADA_SAIDA: true,
            CHAVE_ACESSO: true,

            VALOR_ICMS: true,
            VALOR_ICMS_ST: true,
            VALOR_FCP: true,
            VALOR_FCP_ST: true,
            VALOR_IPI: true,
            VALOR_FRETE: true,
            VALOR_DESPESAS_ACESSORIAS: true,
            VALOR_SEGURO: true,
            VALOR_DESCONTO: true,

            VALOR_TOTAL: true,
            VALOR_TOTAL_PRODUTOS: true,
            empresa: {
              select: {
                RAZAO_SOCIAL: true,
              },
            },
            fin_lancamento_pagar: {
              select: {
                HISTORICO: true,
              },
            },
            INFORMACOES_ADD_CONTRIBUINTE: true,
            INFORMACOES_ADD_FISCO: true,
            fornecedor: {
              select: {
                pessoa: {
                  select: {
                    NOME: true,
                    pessoa_juridica: {
                      select: {
                        CNPJ: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        return { invoiceEntry };
      } catch (error) {
        console.error(
          "An error occurred when returning entry invoice id:",
          error
        );
        throw error;
      }
    }),

  products: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const invoiceEntry = await gestorPrisma.nfe_detalhe.findMany({
          where: {
            ID_NFE_CABECALHO: id,
          },
          select: {
            ID: true,
            ID_PRODUTO: true,
            GTIN: true,
            NOME_PRODUTO: true,
            UNIDADE_COMERCIAL: true,
            QUANTIDADE_COMERCIAL: true,
            VALOR_UNITARIO_COMERCIAL: true,
            VALOR_BRUTO_PRODUTO: true,
            VALOR_FRETE: true,
            VALOR_SEGURO: true,
            VALOR_OUTRAS_DESPESAS: true,
            VALOR_DESCONTO: true,
            VALOR_TOTAL: true,
          },
        });

        return { invoiceEntry };
      } catch (error) {
        console.error(
          "An error occurred when returning entry invoice products:",
          error
        );
        throw error;
      }
    }),

  charge: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const invoiceEntry = await gestorPrisma.fin_parcela_pagar.findMany({
          where: {
            fin_lancamento_pagar: {
              ID_NFE_CABECALHO: id,
            },
          },
          select: {
            ID: true,
            NUMERO_PARCELA: true,
            DATA_VENCIMENTO: true,
            VALOR: true,
            fin_parcela_pagamento: {
              select: {
                DATA_PAGAMENTO: true,
              },
            },
          },
        });

        return { invoiceEntry };
      } catch (error) {
        console.error(
          "An error occurred when returning entry invoice charge:",
          error
        );
        throw error;
      }
    }),
});
