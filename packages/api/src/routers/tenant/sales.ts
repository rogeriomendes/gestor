import { format } from "date-fns";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const salesRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        searchTerm: z.string().nullish(),
        idClosing: z.number().min(1).nullish(),
        dataAbertura: z.coerce.date().nullish(),
        horaAbertura: z.string().min(1).nullish(),
        horaFechamento: z.string().min(1).nullish(),
        date: z.coerce.date().nullish(),
        account: z.number().nullish(),
        sortOrder: z.string().nullish(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input.limit ?? 30;

        const {
          cursor,
          searchTerm,
          idClosing,
          dataAbertura,
          horaAbertura,
          horaFechamento,
          date,
          account,
          sortOrder,
          companyId,
        } = input;

        // biome-ignore lint/suspicious/noExplicitAny: tenant context type from procedure
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const timeNow = new Date();
        const timeFormatted = format(timeNow, "HH:mm:ss");

        const closingTime = horaFechamento || timeFormatted;

        const whereSearch = searchTerm && {
          OR: [
            { ID: Number(searchTerm) },
            { NUMERO_NFE: { contains: searchTerm } },
          ],
        };

        const whereDate = date && {
          DATA_VENDA: date,
        };

        const whereAccount = account &&
          account !== 0 && {
            ID_CONTA_CAIXA: account,
          };

        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        const whereClosing = idClosing && {
          ID_CONTA_CAIXA: idClosing,
          DATA_VENDA: dataAbertura,
          HORA_SAIDA: {
            gte: String(horaAbertura),
            lte: String(closingTime),
          },
        };

        const where = {
          ...whereClosing,
          ...whereSearch,
          ...whereDate,
          ...whereAccount,
          ...whereCompany,
        };

        const orderBy = sortOrder
          ? [
              {
                VALOR_TOTAL: sortOrder === "desc" ? "desc" : "asc",
              },
            ]
          : [{ ID: "desc" }];

        const sales = await gestorPrisma.venda_cabecalho.findMany({
          take: limit + 1,
          cursor: cursor ? { ID: Number(cursor) } : undefined,
          where,
          select: {
            ID: true,
            ID_CONTA_CAIXA: true,
            ID_EMPRESA: true,
            DATA_VENDA: true,
            HORA_SAIDA: true,
            VALOR_TOTAL: true,
            DEVOLUCAO: true,
            CANCELADO_ID_USUARIO: true,
            NUMERO_NFE: true,
            NFCE: true,
            OBSERVACAO: true,
            SERIE_NFE: true,
            nfe_cabecalho: {
              select: {
                STATUS_NOTA: true,
              },
            },
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
          orderBy: [...orderBy],
        });

        // Buscar dados das contas caixa para as vendas
        const contaCaixaIds = sales
          .map((sale) => sale.ID_CONTA_CAIXA)
          .filter((id): id is number => id !== null && id !== 0);

        const contasCaixa =
          contaCaixaIds.length > 0
            ? await gestorPrisma.conta_caixa.findMany({
                where: {
                  ID: {
                    in: contaCaixaIds,
                  },
                },
                select: {
                  ID: true,
                  NOME: true,
                },
              })
            : [];

        // Criar um mapa para facilitar a busca
        const contaCaixaMap = new Map(
          contasCaixa.map((conta) => [conta.ID, conta])
        );

        // Adicionar dados da conta caixa às vendas
        const salesWithAccount = sales.map((sale) => ({
          ...sale,
          conta_caixa: sale.ID_CONTA_CAIXA
            ? contaCaixaMap.get(sale.ID_CONTA_CAIXA) || null
            : null,
        }));

        let nextCursor: typeof cursor | undefined;
        if (salesWithAccount.length > limit) {
          const nextSale = salesWithAccount.pop();
          nextCursor = String(nextSale!.ID);
        }

        return {
          sales: salesWithAccount,
          nextCursor,
        };
      } catch (error) {
        console.error("An error occurred when returning sales:", error);
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
        const sales = await gestorPrisma.venda_cabecalho.findUnique({
          where: {
            ID: Number(id),
          },
          select: {
            ID: true,
            ID_VENDA_CONDICOES_PAGAMENTO: true,
            ID_VENDA_ORCAMENTO_CABECALHO: true,
            ID_EMPRESA: true,
            ID_CONTA_CAIXA: true,
            ID_VENDEDOR: true,
            DATA_VENDA: true,
            HORA_SAIDA: true,
            VALOR_SUBTOTAL: true,
            VALOR_DESCONTO: true,
            VALOR_ACRESCIMO: true,
            VALOR_TOTAL: true,
            DEVOLUCAO: true,
            CANCELADO_DATA: true,
            CANCELADO_HORA: true,
            CANCELADO_ID_USUARIO: true,
            MOTIVO: true,
            NUMERO_NFE: true,
            NFCE: true,
            SERIE_NFE: true,
            OBSERVACAO: true,
            nfe_cabecalho: {
              select: {
                STATUS_NOTA: true,
                RETORNO_CODIGO: true,
                RETORNO_MOTIVO: true,
                CHAVE_ACESSO: true,
                empresa: {
                  select: {
                    RAZAO_SOCIAL: true,
                    NOME_FANTASIA: true,
                  },
                },
              },
            },
            cliente: {
              select: {
                pessoa: {
                  select: {
                    NOME: true,
                  },
                },
              },
            },
            vendedor: {
              select: {
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
            },
            venda_recebimento: {
              select: {
                ID_FIN_TIPO_RECEBIMENTO: true,
                VALOR_RECEBIDO: true,
                VALOR_DINHEIRO: true,
                VALOR_TROCO: true,
              },
            },
            fin_lancamento_receber: {
              select: {
                ID_CLIENTE: true,
                VALOR_A_RECEBER: true,
                DATA_LANCAMENTO: true,
                fin_parcela_receber: {
                  select: {
                    ID_FIN_STATUS_PARCELA: true,
                  },
                },
              },
            },
          },
        });

        // Buscar dados da conta caixa se existir
        let contaCaixa = null;
        if (sales?.ID_CONTA_CAIXA) {
          contaCaixa = await gestorPrisma.conta_caixa.findUnique({
            where: {
              ID: sales.ID_CONTA_CAIXA,
            },
            select: {
              ID: true,
              NOME: true,
            },
          });
        }

        // Buscar dados da empresa se existir
        let empresa = null;
        if (sales?.ID_EMPRESA) {
          empresa = await gestorPrisma.empresa.findUnique({
            where: {
              ID: sales.ID_EMPRESA,
            },
            select: {
              ID: true,
              RAZAO_SOCIAL: true,
              NOME_FANTASIA: true,
            },
          });
        }

        // Combinar dados da venda com dados da conta caixa e empresa
        const salesWithAccount = sales
          ? {
              ...sales,
              conta_caixa: contaCaixa,
              empresa,
            }
          : null;

        return {
          sales: salesWithAccount,
        };
      } catch (error) {
        console.error("An error occurred when returning sales id:", error);
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
        const sale = await gestorPrisma.venda_detalhe.findMany({
          where: {
            ID_VENDA_CABECALHO: Number(id),
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
            VALOR_ACRESCIMO: true,
            VALOR_TOTAL: true,
          },
        });

        return { sale };
      } catch (error) {
        console.error("An error occurred when returning sale:", error);
        throw error;
      }
    }),
});
