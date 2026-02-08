import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const salesBudgetRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        searchTerm: z.string().nullish(),
        situation: z.string().nullish(),
        seller: z.number().nullish(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input.limit ?? 30;
        const { cursor, searchTerm, situation, seller, companyId } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

        const searchTermTrimmed = searchTerm?.trim();
        let whereSearch:
          | { OR: Array<{ ID?: number; cliente?: object }> }
          | undefined;
        if (searchTermTrimmed) {
          const orConditions: Array<{ ID?: number; cliente?: object }> = [
            { cliente: { pessoa: { NOME: { contains: searchTermTrimmed } } } },
          ];
          const idNum = Number(searchTermTrimmed);
          if (!Number.isNaN(idNum)) {
            orConditions.unshift({ ID: idNum });
          }
          whereSearch = { OR: orConditions };
        }

        const whereSituation = situation &&
          situation !== "T" && {
            SITUACAO: situation,
          };

        const whereSeller = seller &&
          seller !== 0 && {
            ID_VENDEDOR: seller,
          };

        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        const where = {
          ...whereSearch,
          ...whereSituation,
          ...whereSeller,
          ...whereCompany,
        };

        const budgets = await gestorPrisma.venda_orcamento_cabecalho.findMany({
          take: limit + 1,
          cursor: cursor ? { ID: Number(cursor) } : undefined,
          where,
          select: {
            ID: true,
            ID_VENDEDOR: true,
            ID_EMPRESA: true,
            DATA_CADASTRO: true,
            ALTERACAO_DATA_HORA: true,
            VALOR_SUBTOTAL: true,
            VALOR_DESCONTO: true,
            VALOR_ACRESCIMO: true,
            VALOR_TOTAL: true,
            CANCELADO: true,
            CANCELADO_MOTIVO: true,
            CANCELADO_DATA: true,
            CANCELADO_HORA: true,
            CANCELADO_ID_USUARIO: true,
            SITUACAO: true,
            NUMERO_PEDIDO: true,
            OBSERVACAO: true,
            cliente: {
              select: {
                pessoa: {
                  select: {
                    NOME: true,
                  },
                },
              },
            },
          },
          orderBy: {
            ID: "desc",
          },
        });

        // Buscar dados dos vendedores
        const vendedorIds = budgets
          .map((budget: any) => budget.ID_VENDEDOR)
          .filter((id: any): id is number => id !== null && id !== 0);

        const vendedores =
          vendedorIds.length > 0
            ? await gestorPrisma.vendedor.findMany({
                where: {
                  ID: {
                    in: vendedorIds,
                  },
                },
                select: {
                  ID: true,
                  colaborador: {
                    select: {
                      pessoa: {
                        select: {
                          NOME: true,
                        },
                      },
                    },
                  },
                },
              })
            : [];

        const vendedorMap = new Map(
          vendedores.map((vendedor: any) => [vendedor.ID, vendedor])
        );

        // Combinar dados dos orçamentos com dados dos vendedores
        const budgetsWithVendedor = budgets.map((budget: any) => ({
          ...budget,
          vendedor: budget.ID_VENDEDOR
            ? vendedorMap.get(budget.ID_VENDEDOR) || null
            : null,
        }));

        let nextCursor: typeof cursor | undefined;
        if (budgetsWithVendedor.length > limit) {
          const nextSale = budgetsWithVendedor.pop();
          nextCursor = String(nextSale!.ID);
        }

        return {
          budgets: budgetsWithVendedor,
          nextCursor,
        };
      } catch (error) {
        console.error("An error occurred when returning budgets:", error);
        throw error;
      }
    }),

  byId: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const budget = await gestorPrisma.venda_orcamento_cabecalho.findUnique({
          where: {
            ID: Number(id),
          },
          select: {
            ID: true,
            ID_VENDEDOR: true,
            ID_EMPRESA: true,
            DATA_CADASTRO: true,
            ALTERACAO_DATA_HORA: true,
            VALOR_SUBTOTAL: true,
            VALOR_DESCONTO: true,
            VALOR_ACRESCIMO: true,
            VALOR_TOTAL: true,
            CANCELADO: true,
            CANCELADO_MOTIVO: true,
            CANCELADO_DATA: true,
            CANCELADO_HORA: true,
            CANCELADO_ID_USUARIO: true,
            SITUACAO: true,
            NUMERO_PEDIDO: true,
            OBSERVACAO: true,
            cliente: {
              select: {
                pessoa: {
                  select: {
                    NOME: true,
                  },
                },
              },
            },
            venda_cabecalho: {
              select: {
                ID: true,
              },
            },
          },
        });

        // Buscar dados da empresa se existir
        let empresa = null;
        if (budget?.ID_EMPRESA) {
          empresa = await gestorPrisma.empresa.findUnique({
            where: {
              ID: budget.ID_EMPRESA,
            },
            select: {
              ID: true,
              RAZAO_SOCIAL: true,
              NOME_FANTASIA: true,
            },
          });
        }

        // Buscar dados do vendedor se existir
        let vendedor = null;
        if (budget?.ID_VENDEDOR) {
          vendedor = await gestorPrisma.vendedor.findUnique({
            where: {
              ID: budget.ID_VENDEDOR,
            },
            select: {
              ID: true,
              colaborador: {
                select: {
                  pessoa: {
                    select: {
                      NOME: true,
                    },
                  },
                },
              },
            },
          });
        }

        // Combinar dados do orçamento com dados da empresa e vendedor
        const budgetWithEmpresa = budget
          ? {
              ...budget,
              empresa,
              vendedor,
            }
          : null;

        return {
          budget: budgetWithEmpresa,
        };
      } catch (error) {
        console.error("An error occurred when returning budget:", error);
        throw error;
      }
    }),

  productsById: tenantProcedure
    .input(
      z.object({
        id: z.number().min(1).nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { id } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const budget = await gestorPrisma.venda_orcamento_detalhe.findMany({
          where: {
            ID_VENDA_ORCAMENTO_CABECALHO: Number(id),
          },
          select: {
            ID: true,
            produto: {
              select: {
                NOME: true,
                GTIN: true,
                CODIGO_INTERNO: true,
                PRODUTO_PESADO: true,
                unidade_produto: {
                  select: {
                    SIGLA: true,
                    DESCRICAO: true,
                  },
                },
              },
            },
            QUANTIDADE: true,
            VALOR_UNITARIO: true,
            VALOR_SUBTOTAL: true,
            VALOR_DESCONTO: true,
            VALOR_TOTAL: true,
          },
        });

        return { budget };
      } catch (error) {
        console.error("An error occurred when returning budget:", error);
        throw error;
      }
    }),
});
