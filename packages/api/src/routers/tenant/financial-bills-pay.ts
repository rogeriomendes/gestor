import type { Tenant } from "@gestor/db/types";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const financialBillsPayRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        company: z.number().nullish(),
        supplier: z.union([z.number(), z.array(z.number())]).nullish(),
        filter: z.string().nullish(),
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
        const { cursor, company, supplier, filter, date } = input;

        const orderBy =
          filter === "open"
            ? ([{ DATA_VENCIMENTO: "asc" }] as const)
            : ([{ DATA_VENCIMENTO: "desc" }] as const);

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
              DATA_VENCIMENTO: {
                gte: new Date(format(date.from, "yyyy-MM-dd")),
                ...(date.to
                  ? { lte: new Date(format(date.to, "yyyy-MM-dd")) }
                  : {}),
              },
            }
          : {};

        const whereFilter =
          filter === "paid"
            ? {
                fin_status_parcela: {
                  SITUACAO: "2",
                },
              }
            : filter === "open"
              ? {
                  fin_status_parcela: {
                    SITUACAO: {
                      not: "2",
                    },
                  },
                }
              : {};

        const where = {
          ...whereFilter,
          ...whereDate,
          ID_CONTA_CAIXA: 2,
          PARCELA_CANCELADA: "N",
          fin_lancamento_pagar: {
            ESTORNO: "N",
            CANCELADO: "N",
            ...whereCompany,
            ...whereSupplier,
          },
        };

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const financialBills = await gestorPrisma.fin_parcela_pagar.findMany({
          take: limit + 1,
          cursor: cursor ? { ID: Number(cursor) } : undefined,
          where,
          select: {
            ID: true,
            NUMERO_PARCELA: true,
            DATA_VENCIMENTO: true,
            VALOR: true,
            ID_FIN_LANCAMENTO_PAGAR: true,
            fin_lancamento_pagar: {
              select: {
                HISTORICO: true,
                ID_EMPRESA: true,
                DATA_LANCAMENTO: true,
                HORA_ALTERACAO: true,
                ID_NFE_CABECALHO: true,
                ID_FORNECEDOR: true,
                NUMERO_DOCUMENTO: true,
                nfe_cabecalho: {
                  select: {
                    SERIE: true,
                    NUMERO: true,
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
                },
              },
            },
            fin_status_parcela: {
              select: {
                SITUACAO: true,
                DESCRICAO: true,
              },
            },
          },
          orderBy: [...orderBy, { ID: "desc" }],
        });

        // Buscar dados das empresas
        const empresaIds = financialBills
          .map((bill: any) => bill.fin_lancamento_pagar.ID_EMPRESA)
          .filter((id: any): id is number => id !== null && id !== 0);

        const empresas =
          empresaIds.length > 0
            ? await gestorPrisma.empresa.findMany({
                where: {
                  ID: {
                    in: empresaIds,
                  },
                },
                select: {
                  ID: true,
                  RAZAO_SOCIAL: true,
                  NOME_FANTASIA: true,
                },
              })
            : [];

        const empresaMap = new Map(
          empresas.map((empresa: any) => [empresa.ID, empresa])
        );

        // Buscar dados dos fornecedores
        const fornecedorIds = financialBills
          .map((bill: any) => bill.fin_lancamento_pagar.ID_FORNECEDOR)
          .filter((id: any): id is number => id !== null && id !== 0);

        const fornecedores =
          fornecedorIds.length > 0
            ? await gestorPrisma.fornecedor.findMany({
                where: {
                  ID: {
                    in: fornecedorIds,
                  },
                },
                select: {
                  ID: true,
                  pessoa: {
                    select: {
                      NOME: true,
                    },
                  },
                },
              })
            : [];

        const fornecedorMap = new Map(
          fornecedores.map((fornecedor: any) => [fornecedor.ID, fornecedor])
        );

        // Buscar contagem de parcelas para cada ID_FIN_LANCAMENTO_PAGAR
        const lancamentoIds = financialBills
          .map((bill: any) => bill.ID_FIN_LANCAMENTO_PAGAR)
          .filter((id: any): id is number => id !== null && id !== 0);

        const parcelasCount =
          lancamentoIds.length > 0
            ? await gestorPrisma.fin_parcela_pagar.groupBy({
                by: ["ID_FIN_LANCAMENTO_PAGAR"],
                where: {
                  ID_FIN_LANCAMENTO_PAGAR: { in: lancamentoIds },
                },
                _count: {
                  ID: true,
                },
              })
            : [];

        type ParcelasCountRow = (typeof parcelasCount)[number];
        const parcelasCountMap = new Map<number, number>(
          parcelasCount.map((item: ParcelasCountRow) => [
            item.ID_FIN_LANCAMENTO_PAGAR,
            item._count.ID,
          ])
        );

        // Combinar dados das contas a pagar com dados das empresas e fornecedores
        const financialBillsWithEmpresa = financialBills.map((bill: any) => ({
          ...bill,
          fin_lancamento_pagar: {
            ...bill.fin_lancamento_pagar,
            empresa: bill.fin_lancamento_pagar.ID_EMPRESA
              ? empresaMap.get(bill.fin_lancamento_pagar.ID_EMPRESA) || null
              : null,
            fornecedor: bill.fin_lancamento_pagar.ID_FORNECEDOR
              ? fornecedorMap.get(bill.fin_lancamento_pagar.ID_FORNECEDOR) ||
                null
              : null,
          },
          parcelasCount:
            parcelasCountMap.get(bill.ID_FIN_LANCAMENTO_PAGAR) || 0,
        }));

        let nextCursor: typeof cursor | undefined;
        if (financialBillsWithEmpresa.length > limit) {
          const nextSale = financialBillsWithEmpresa.pop();
          nextCursor = String(nextSale!.ID);
        }

        return {
          financialBills: financialBillsWithEmpresa,
          nextCursor,
        };
      } catch (error) {
        console.error("An error occurred when returning bills:", error);
        throw error;
      }
    }),

  countIdFinPay: tenantProcedure
    .input(
      z.object({
        id: z.number().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        const whereIDPagar = id !== null &&
          id !== undefined && {
            ID_FIN_LANCAMENTO_PAGAR: id,
          };

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const countIdFinPay = await gestorPrisma.fin_parcela_pagar.count({
          where: {
            ...whereIDPagar,
          },
        });

        return { countIdFinPay };
      } catch (error) {
        console.error(
          "An error occurred when returning count repeat id:",
          error
        );
        throw error;
      }
    }),

  charge: tenantProcedure
    .input(
      z.object({
        id: z.number().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        const whereIDPagar = id !== null &&
          id !== undefined && {
            ID_FIN_LANCAMENTO_PAGAR: id,
          };

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const charge = await gestorPrisma.fin_parcela_pagar.findMany({
          where: {
            ...whereIDPagar,
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

        return { charge };
      } catch (error) {
        console.error(
          "An error occurred when returning count repeat id:",
          error
        );
        throw error;
      }
    }),

  amount: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        company: z.number().nullish(),
        supplier: z.union([z.number(), z.array(z.number())]).nullish(),
        filter: z.string().nullish(),
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
        const { company, supplier, filter, date } = input;

        const today = new Date();
        const firstDateOfWeek = new Date(
          format(startOfWeek(today), "yyyy-MM-dd")
        );
        const lastDateOfWeek = new Date(format(endOfWeek(today), "yyyy-MM-dd"));

        const whereCompany = company &&
          company !== 0 && {
            ID_EMPRESA: company,
          };

        const whereSupplier = supplier &&
          supplier !== 0 && {
            ID_FORNECEDOR: Array.isArray(supplier)
              ? { in: supplier }
              : supplier,
          };

        const whereDate =
          date && date !== undefined
            ? {
                DATA_VENCIMENTO: {
                  gte: new Date(format(date.from, "yyyy-MM-dd")),
                  ...(date.to
                    ? { lte: new Date(format(date.to, "yyyy-MM-dd")) }
                    : {}),
                },
                fin_status_parcela: {
                  SITUACAO: {
                    not: "2",
                  },
                },
              }
            : {};

        const whereFilter =
          filter === "week"
            ? {
                DATA_VENCIMENTO: {
                  gte: firstDateOfWeek,
                  lte: lastDateOfWeek,
                },
                fin_status_parcela: {
                  SITUACAO: {
                    not: "2",
                  },
                },
              }
            : filter === "all"
              ? {
                  fin_status_parcela: {
                    SITUACAO: {
                      not: "2",
                    },
                  },
                }
              : {};

        const where = {
          ...whereFilter,
          ...whereDate,
          ID_CONTA_CAIXA: 2,
          PARCELA_CANCELADA: "N",
          fin_lancamento_pagar: {
            ESTORNO: "N",
            CANCELADO: "N",
            ...whereCompany,
            ...whereSupplier,
          },
        };

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const billsAmount = await gestorPrisma.fin_parcela_pagar.findMany({
          where,
          select: {
            VALOR: true,
          },
        });
        const totalAmount = billsAmount.reduce(
          (total: number, bill: { VALOR: unknown }) =>
            total + Number.parseFloat(String(bill.VALOR) || "0"),
          0
        );

        return { totalAmount };
      } catch (error) {
        console.error(
          "An error occurred when returning bills total amount:",
          error
        );
        throw error;
      }
    }),
});
