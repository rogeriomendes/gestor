import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const reportsRouter = router({
  salesPerDay: tenantProcedure
    .input(
      z.object({
        initialDate: z.coerce.date(),
        finalDate: z.coerce.date(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { initialDate, finalDate, companyId } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        const salesPerDay = await gestorPrisma.venda_cabecalho.groupBy({
          by: ["DATA_VENDA"],
          _sum: { VALOR_TOTAL: true },
          _count: { ID: true },
          where: {
            DEVOLUCAO: "N",
            CANCELADO_ID_USUARIO: { equals: null },
            DATA_VENDA: {
              gte: initialDate,
              lte: finalDate,
            },
            ...whereCompany,
          },
        });

        const totalValuePerDay = salesPerDay.map(
          ({ DATA_VENDA, _sum: { VALOR_TOTAL }, _count: { ID } }) => {
            if (!DATA_VENDA) {
              throw new Error("DATA_VENDA was null for a record");
            }
            return {
              date: format(toZonedTime(DATA_VENDA, "UTC"), "yyyy-MM-dd"),
              total: Number(VALOR_TOTAL || 0),
              count: ID,
            };
          }
        );

        return { totalValuePerDay };
      } catch (error) {
        console.error(
          "An error occurred while calculating the total value per day:",
          error
        );
        throw error;
      }
    }),

  salesPerSeller: tenantProcedure
    .input(
      z.object({
        initialDate: z.coerce.date(),
        finalDate: z.coerce.date(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { initialDate, finalDate, companyId } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        const salesPerSeller = await gestorPrisma.venda_cabecalho.groupBy({
          by: ["ID_VENDEDOR"],
          _sum: { VALOR_TOTAL: true },
          _count: { ID: true },
          where: {
            DEVOLUCAO: "N",
            CANCELADO_ID_USUARIO: { equals: null },
            DATA_VENDA: {
              gte: initialDate,
              lte: finalDate,
            },
            ...whereCompany,
          },
        });

        const result = await Promise.all(
          salesPerSeller.map(async ({ ID_VENDEDOR, _sum, _count }) => {
            const seller = await gestorPrisma.colaborador.findUnique({
              where: { ID: ID_VENDEDOR },
              select: {
                pessoa: {
                  select: { NOME: true },
                },
              },
            });

            return {
              sellerId: ID_VENDEDOR,
              sellerName: seller?.pessoa?.NOME || "Vendedor não encontrado",
              total: Number(_sum.VALOR_TOTAL || 0),
              count: _count.ID,
            };
          })
        );

        return { salesPerSeller: result };
      } catch (error) {
        console.error("Error calculating sales per seller:", error);
        throw error;
      }
    }),

  topProducts: tenantProcedure
    .input(
      z.object({
        initialDate: z.coerce.date(),
        finalDate: z.coerce.date(),
        limit: z.number().min(1).max(100).default(10),
        companyId: z.number().optional(),
        searchTerm: z.string().optional(),
        orderBy: z.enum(["value", "quantity"]).default("value"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const {
          initialDate,
          finalDate,
          limit,
          companyId,
          searchTerm,
          orderBy,
        } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        // Filtro de busca
        const whereProduct = searchTerm
          ? {
              OR: [
                { produto: { NOME: { contains: searchTerm } } },
                { produto: { CODIGO_INTERNO: { contains: searchTerm } } },
              ],
            }
          : {};

        // Buscar produtos mais vendidos usando uma abordagem diferente
        const topProducts = await gestorPrisma.venda_detalhe.findMany({
          where: {
            venda_cabecalho: {
              DEVOLUCAO: "N",
              CANCELADO_ID_USUARIO: { equals: null },
              DATA_VENDA: {
                gte: initialDate,
                lte: finalDate,
              },
              ...whereCompany,
            },
            ...whereProduct,
          },
          select: {
            ID_PRODUTO: true,
            QUANTIDADE: true,
            VALOR_TOTAL: true,
            produto: {
              select: {
                NOME: true,
                CODIGO_INTERNO: true,
                VALOR_VENDA: true,
                unidade_produto: {
                  select: {
                    SIGLA: true,
                    DESCRICAO: true,
                  },
                },
              },
            },
          },
        });

        // Agrupar por produto e somar valores
        const productMap = new Map<
          number,
          {
            productId: number;
            productName: string;
            productCode: string | null;
            quantity: number;
            totalValue: number;
            unitPrice: number;
            unitName: string;
            unitDescription: string;
          }
        >();

        topProducts.forEach((item) => {
          const productId = item.ID_PRODUTO;
          const existing = productMap.get(productId);

          if (existing) {
            existing.quantity += Number(item.QUANTIDADE || 0);
            existing.totalValue += Number(item.VALOR_TOTAL || 0);
          } else {
            productMap.set(productId, {
              productId,
              productName: item.produto?.NOME || "Produto não encontrado",
              productCode: item.produto?.CODIGO_INTERNO || null,
              quantity: Number(item.QUANTIDADE || 0),
              totalValue: Number(item.VALOR_TOTAL || 0),
              unitPrice: Number(item.produto?.VALOR_VENDA || 0),
              unitName: item.produto?.unidade_produto?.SIGLA || "N/A",
              unitDescription:
                item.produto?.unidade_produto?.DESCRICAO || "N/A",
            });
          }
        });

        // Converter para array e ordenar
        const result = Array.from(productMap.values())
          .sort((a, b) => {
            if (orderBy === "quantity") {
              return b.quantity - a.quantity;
            }
            return b.totalValue - a.totalValue;
          })
          .slice(0, limit);

        return { topProducts: result };
      } catch (error) {
        console.error("Error calculating top products:", error);
        throw error;
      }
    }),

  // Relatórios Financeiros
  accountsReceivable: tenantProcedure
    .input(
      z.object({
        status: z.enum(["all", "pending", "overdue"]).default("all"),
        initialDate: z.coerce.date().optional(),
        finalDate: z.coerce.date().optional(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { status, initialDate, finalDate, companyId } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        // Buscar contas a receber diretamente da tabela fin_parcela_receber
        const whereClause: any = {
          fin_lancamento_receber: {
            CANCELADO: "N",
            venda_cabecalho: whereCompany,
          },
        };

        if (status === "pending") {
          whereClause.DATA_VENCIMENTO = {
            gte: new Date(),
          };
        } else if (status === "overdue") {
          whereClause.DATA_VENCIMENTO = {
            lt: new Date(),
          };
        }

        if (initialDate && finalDate) {
          whereClause.DATA_VENCIMENTO = {
            ...whereClause.DATA_VENCIMENTO,
            gte: initialDate,
            lte: finalDate,
          };
        }

        const accountsReceivable =
          await gestorPrisma.fin_parcela_receber.findMany({
            where: whereClause,
            select: {
              ID: true,
              VALOR: true,
              DATA_VENCIMENTO: true,
              ID_FIN_LANCAMENTO_RECEBER: true,
            },
            orderBy: {
              DATA_VENCIMENTO: "asc",
            },
            take: 100, // Limitar resultados para evitar sobrecarga
          });

        const result = accountsReceivable.map((account) => {
          try {
            const pending = Number(account.VALOR || 0);
            const dueDate = account.DATA_VENCIMENTO;
            const isOverdue = dueDate ? dueDate < new Date() : false;

            return {
              id: account.ID,
              clientName: `Cliente ${account.ID_FIN_LANCAMENTO_RECEBER}`,
              dueDate,
              amount: Number(account.VALOR || 0),
              received: 0,
              pending,
              isOverdue,
            };
          } catch (itemError) {
            console.error(
              "Erro ao processar item de conta a receber:",
              itemError
            );
            return {
              id: account.ID,
              clientName: "Erro ao carregar",
              dueDate: null,
              amount: 0,
              received: 0,
              pending: 0,
              isOverdue: false,
            };
          }
        });

        return { accountsReceivable: result };
      } catch (error) {
        console.error("Error calculating accounts receivable:", error);
        // Retornar dados vazios em caso de erro para evitar travamento
        return { accountsReceivable: [] };
      }
    }),

  // Relatórios de Estoque
  stockPosition: tenantProcedure
    .input(
      z.object({
        lowStock: z.boolean().default(false),
        category: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { lowStock, category } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        let whereClause: any = {};

        if (lowStock) {
          whereClause = {
            QUANTIDADE_ESTOQUE: { not: null },
            ESTOQUE_MINIMO: { not: null },
          };
        }

        if (category) {
          whereClause.ID_GRUPO = category;
        }

        const stockPosition = await gestorPrisma.produto.findMany({
          where: whereClause,
          select: {
            ID: true,
            NOME: true,
            CODIGO_INTERNO: true,
            QUANTIDADE_ESTOQUE: true,
            ESTOQUE_MINIMO: true,
            ESTOQUE_MAXIMO: true,
            VALOR_COMPRA: true,
            VALOR_VENDA: true,
            produto_sub_grupo: {
              select: {
                NOME: true,
              },
            },
          },
          orderBy: {
            NOME: "asc",
          },
        });

        let result = stockPosition.map((product) => ({
          id: product.ID,
          name: product.NOME || "Produto sem nome",
          code: product.CODIGO_INTERNO,
          currentStock: Number(product.QUANTIDADE_ESTOQUE || 0),
          minStock: Number(product.ESTOQUE_MINIMO || 0),
          maxStock: Number(product.ESTOQUE_MAXIMO || 0),
          purchasePrice: Number(product.VALOR_COMPRA || 0),
          salePrice: Number(product.VALOR_VENDA || 0),
          category: product.produto_sub_grupo?.NOME || "Sem categoria",
          stockValue:
            Number(product.QUANTIDADE_ESTOQUE || 0) *
            Number(product.VALOR_COMPRA || 0),
          isLowStock:
            Number(product.QUANTIDADE_ESTOQUE || 0) <=
            Number(product.ESTOQUE_MINIMO || 0),
        }));

        if (lowStock) {
          result = result.filter((r) => r.isLowStock);
        }

        return { stockPosition: result };
      } catch (error) {
        console.error("Error calculating stock position:", error);
        throw error;
      }
    }),

  // Relatórios Gerenciais
  financialSummary: tenantProcedure
    .input(
      z.object({
        initialDate: z.coerce.date(),
        finalDate: z.coerce.date(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { initialDate, finalDate, companyId } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        // Vendas do período
        const sales = await gestorPrisma.venda_cabecalho.aggregate({
          _sum: { VALOR_TOTAL: true },
          _count: { ID: true },
          where: {
            DEVOLUCAO: "N",
            CANCELADO_ID_USUARIO: { equals: null },
            DATA_VENDA: {
              gte: initialDate,
              lte: finalDate,
            },
            ...whereCompany,
          },
        });

        // Recebimentos do período
        const receipts = await gestorPrisma.fin_parcela_recebimento.aggregate({
          _sum: { VALOR_RECEBIDO: true },
          where: {
            DATA_RECEBIMENTO: {
              gte: initialDate,
              lte: finalDate,
            },
            ST_SUPRIMENTO: "N",
            fin_parcela_receber: {
              fin_lancamento_receber: {
                venda_cabecalho: whereCompany,
              },
            },
          },
        });

        // Pagamentos do período
        const payments = await gestorPrisma.fin_parcela_pagamento.aggregate({
          _sum: { VALOR_PAGO: true },
          where: {
            DATA_PAGAMENTO: {
              gte: initialDate,
              lte: finalDate,
            },
          },
        });

        // Contas a receber pendentes
        const pendingReceivables =
          await gestorPrisma.fin_parcela_receber.aggregate({
            _sum: { VALOR: true },
            where: {
              fin_parcela_recebimento: {
                none: {},
              },
              fin_lancamento_receber: {
                CANCELADO: "N",
                venda_cabecalho: whereCompany,
              },
            },
          });

        // Contas a pagar pendentes
        const pendingPayables = await gestorPrisma.fin_parcela_pagar.aggregate({
          _sum: { VALOR: true },
          where: {
            fin_parcela_pagamento: {
              none: {},
            },
            fin_lancamento_pagar: {
              CANCELADO: "N",
            },
          },
        });

        return {
          sales: {
            total: Number(sales._sum.VALOR_TOTAL || 0),
            count: sales._count.ID || 0,
          },
          receipts: {
            total: Number(receipts._sum.VALOR_RECEBIDO || 0),
          },
          payments: {
            total: Number(payments._sum.VALOR_PAGO || 0),
          },
          pendingReceivables: {
            total: Number(pendingReceivables._sum.VALOR || 0),
          },
          pendingPayables: {
            total: Number(pendingPayables._sum.VALOR || 0),
          },
        };
      } catch (error) {
        console.error("Error calculating financial summary:", error);
        // Retornar dados padrão em caso de erro para evitar travamento
        return {
          sales: { total: 0, count: 0 },
          receipts: { total: 0 },
          payments: { total: 0 },
          pendingReceivables: { total: 0 },
          pendingPayables: { total: 0 },
        };
      }
    }),

  // Relatório existente mantido para compatibilidade
  salesPerType: tenantProcedure
    .input(
      z.object({
        initialDate: z.coerce.date(),
        finalDate: z.coerce.date(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { initialDate, finalDate, companyId } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);

        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        const salesPerType =
          await gestorPrisma.fin_parcela_recebimento.findMany({
            where: {
              fin_parcela_receber: {
                fin_lancamento_receber: {
                  CANCELADO: "N",
                  venda_cabecalho: whereCompany,
                },
              },
              ST_SUPRIMENTO: "N",
              DATA_RECEBIMENTO: {
                gte: initialDate,
                lte: finalDate,
              },
            },
            select: {
              VALOR_RECEBIDO: true,
              DATA_RECEBIMENTO: true,
              fin_tipo_recebimento: {
                select: {
                  ID: true,
                  DESCRICAO: true,
                  TIPO: true,
                },
              },
            },
            orderBy: {
              DATA_RECEBIMENTO: "asc",
            },
          });

        const resultMap = new Map<
          string,
          { date: string; total: number; [key: string]: number | string | null }
        >();

        salesPerType.forEach((sale) => {
          const { DATA_RECEBIMENTO, VALOR_RECEBIDO, fin_tipo_recebimento } =
            sale;
          const { DESCRICAO } = fin_tipo_recebimento;

          if (!DATA_RECEBIMENTO) {
            return;
          }

          const formattedDate = format(
            toZonedTime(DATA_RECEBIMENTO, "UTC"),
            "yyyy-MM-dd"
          );
          const valorRecebido = Number(VALOR_RECEBIDO) || 0;

          if (!resultMap.has(formattedDate)) {
            resultMap.set(formattedDate, { date: formattedDate, total: 0 });
          }

          const dateEntry = resultMap.get(formattedDate);

          if (dateEntry) {
            dateEntry.total += valorRecebido;

            if (DESCRICAO) {
              if (typeof dateEntry[DESCRICAO] !== "number") {
                dateEntry[DESCRICAO] = 0;
              }

              dateEntry[DESCRICAO] = dateEntry[DESCRICAO] + valorRecebido;
            }
          }
        });

        const result = Array.from(resultMap.values());

        return { result };
      } catch (error) {
        console.error(
          "An error occurred while calculating the total value per type and date:",
          error
        );
        throw new Error("Failed to calculate sales per type and date");
      }
    }),
});
