import type { Tenant } from "@gestor/db/types";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const financialBillsReceiveRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        clientId: z.number().min(1).nullish(),
        companyId: z.number().optional(),
        status: z.number().min(0).max(4).nullish(),
        dateFrom: z.coerce.date().nullish(),
        dateTo: z.coerce.date().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input.limit ?? 30;
        const { cursor, clientId, companyId, status, dateFrom, dateTo } = input;

        // Construir filtros dinamicamente
        const whereClause: any = {
          PARCELA_CANCELADA: "N",
          fin_lancamento_receber: {
            ID_CLIENTE: clientId ? Number(clientId) : undefined,
            CANCELADO: "N",
            venda_cabecalho:
              companyId && companyId !== 0
                ? { ID_EMPRESA: companyId }
                : undefined,
          },
        };

        // Filtro por status
        if (status) {
          if (status === 0) {
            // TODOS - exibe todos os status
            whereClause.ID_FIN_STATUS_PARCELA = { in: [1, 2, 3, 4] };
          } else if (status === 1) {
            // ABERTO - exibir abertos (1) e parcial (3)
            whereClause.ID_FIN_STATUS_PARCELA = { not: 2 };
          } else if (status === 2) {
            // QUITADO - exibir apenas quitados (2)
            whereClause.ID_FIN_STATUS_PARCELA = status;
          } else if (status === 3) {
            // PARCIAL - exibir apenas parciais (3)
            whereClause.ID_FIN_STATUS_PARCELA = status;
          }
        }

        // Filtro por período (data de lançamento)
        if (dateFrom || dateTo) {
          whereClause.fin_lancamento_receber.DATA_LANCAMENTO = {};
          if (dateFrom) {
            whereClause.fin_lancamento_receber.DATA_LANCAMENTO.gte = dateFrom;
          }
          if (dateTo) {
            whereClause.fin_lancamento_receber.DATA_LANCAMENTO.lte = dateTo;
          }
        }

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const receive = await gestorPrisma.fin_parcela_receber.findMany({
          take: limit + 1,
          cursor: cursor ? { ID: Number(cursor) } : undefined,
          where: whereClause,
          select: {
            ID: true,
            ID_FIN_STATUS_PARCELA: true,
            fin_lancamento_receber: {
              select: {
                ID_CLIENTE: true,
                ID_VENDA_CABECALHO: true,

                VALOR_A_RECEBER: true,
                DATA_LANCAMENTO: true,
                ID_VENDEDOR: true,
                HISTORICO: true,
                fin_parcela_receber: {
                  select: {
                    fin_parcela_recebimento: {
                      select: {
                        VALOR_RECEBIDO: true,
                      },
                    },
                  },
                },
                venda_cabecalho: {
                  select: {
                    ID: true,
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
                    nfe_cabecalho: {
                      select: {
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
                  },
                },
              },
            },
          },
          orderBy: {
            ID: "desc",
          },
        });

        // Buscar dados das contas caixa para os recebimentos
        const contaCaixaIds = receive
          .map(
            (item: any) =>
              item.fin_lancamento_receber.venda_cabecalho?.ID_CONTA_CAIXA
          )
          .filter(
            (id: any): id is number =>
              id !== null && id !== undefined && id !== 0
          );

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

        // Buscar dados dos clientes para os recebimentos
        const clienteIds = receive
          .map((item: any) => item.fin_lancamento_receber.ID_CLIENTE)
          .filter(
            (id: any): id is number =>
              id !== null && id !== undefined && id !== 0
          );

        const clientes =
          clienteIds.length > 0
            ? await gestorPrisma.cliente.findMany({
                where: {
                  ID: {
                    in: clienteIds,
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

        // Criar mapas para facilitar a busca
        const contaCaixaMap = new Map(
          contasCaixa.map((conta: any) => [conta.ID, conta])
        );
        const clienteMap = new Map(
          clientes.map((cliente: any) => [cliente.ID, cliente])
        );

        // Calcular valores para cada recebimento e adicionar dados da conta caixa e cliente
        const receiveWithCalculatedValues = receive.map((item: any) => {
          const valorAReceber = Number(
            item.fin_lancamento_receber.VALOR_A_RECEBER || 0
          );
          let valorRecebido = 0;

          // Calcular valor recebido através de fin_parcela_recebimento
          if (
            item.fin_lancamento_receber.fin_parcela_receber &&
            Array.isArray(item.fin_lancamento_receber.fin_parcela_receber)
          ) {
            item.fin_lancamento_receber.fin_parcela_receber.forEach(
              (parcela: any) => {
                if (
                  parcela.fin_parcela_recebimento &&
                  Array.isArray(parcela.fin_parcela_recebimento)
                ) {
                  parcela.fin_parcela_recebimento.forEach(
                    (recebimento: any) => {
                      valorRecebido += Number(recebimento.VALOR_RECEBIDO || 0);
                    }
                  );
                }
              }
            );
          }

          const valorRestante = valorAReceber - valorRecebido;

          // Adicionar dados da conta caixa
          const contaCaixa = item.fin_lancamento_receber.venda_cabecalho
            ?.ID_CONTA_CAIXA
            ? contaCaixaMap.get(
                item.fin_lancamento_receber.venda_cabecalho.ID_CONTA_CAIXA
              ) || null
            : null;

          // Adicionar dados do cliente
          const cliente = item.fin_lancamento_receber.ID_CLIENTE
            ? clienteMap.get(item.fin_lancamento_receber.ID_CLIENTE) || null
            : null;

          return {
            ...item,
            fin_lancamento_receber: {
              ...item.fin_lancamento_receber,
              VALOR_A_RECEBER: valorAReceber,
              VALOR_RECEBIDO: valorRecebido,
              VALOR_RESTANTE: valorRestante,
              cliente,
              venda_cabecalho: item.fin_lancamento_receber.venda_cabecalho
                ? {
                    ...item.fin_lancamento_receber.venda_cabecalho,
                    conta_caixa: contaCaixa,
                  }
                : null,
            },
          };
        });

        let nextCursor: typeof cursor | undefined;
        if (receiveWithCalculatedValues.length > limit) {
          const nextSale = receiveWithCalculatedValues.pop();
          nextCursor = String(nextSale?.ID);
        }

        return {
          receive: receiveWithCalculatedValues,
          nextCursor,
        };
      } catch (error) {
        console.error("An error occurred when returning receive:", error);
        throw error;
      }
    }),

  amount: tenantProcedure
    .input(
      z.object({
        clientId: z.number().min(1).nullish(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { clientId, companyId } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const receiveAmount = await gestorPrisma.fin_parcela_receber.findMany({
          where: {
            PARCELA_CANCELADA: "N",
            ID_FIN_STATUS_PARCELA: { not: 2 },
            fin_lancamento_receber: {
              ID_CLIENTE: clientId ? Number(clientId) : undefined,
              CANCELADO: "N",
              venda_cabecalho:
                companyId && companyId !== 0
                  ? { ID_EMPRESA: companyId }
                  : undefined,
            },
          },
          select: {
            ID_FIN_STATUS_PARCELA: true,
            fin_parcela_recebimento: {
              select: {
                VALOR_RECEBIDO: true,
              },
            },
            fin_lancamento_receber: {
              select: {
                ID_CLIENTE: true,
                VALOR_A_RECEBER: true,
              },
            },
          },
        });

        type ReceiveRow = (typeof receiveAmount)[number];
        const totalAmount = receiveAmount.reduce(
          (total: number, receive: ReceiveRow) => {
            const valorAReceber = Number.parseFloat(
              String(receive.fin_lancamento_receber.VALOR_A_RECEBER) || "0"
            );

            // Se o status é 3 (parcialmente pago), subtrair o valor já recebido
            if (receive.ID_FIN_STATUS_PARCELA === 3) {
              const valorRecebido = receive.fin_parcela_recebimento.reduce(
                (sum: number, recebimento: { VALOR_RECEBIDO: unknown }) =>
                  sum +
                  Number.parseFloat(String(recebimento.VALOR_RECEBIDO) || "0"),
                0
              );
              return total + (valorAReceber - valorRecebido);
            }

            // Para outros status (1 = em aberto, etc.), usar o valor total
            return total + valorAReceber;
          },
          0
        );

        return { totalAmount };
      } catch (error) {
        console.error(
          "An error occurred when returning receive total amount:",
          error
        );
        throw error;
      }
    }),

  amountLowered: tenantProcedure
    .input(
      z.object({
        clientId: z.number().min(1).nullish(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { clientId, companyId } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const receive = await gestorPrisma.fin_parcela_receber.findMany({
          take: 1,
          where: {
            PARCELA_CANCELADA: "N",
            ID_FIN_STATUS_PARCELA: { in: [2, 3] },
            fin_lancamento_receber: {
              ID_CLIENTE: clientId,
              CANCELADO: "N",
              venda_cabecalho:
                companyId && companyId !== 0
                  ? { ID_EMPRESA: companyId }
                  : undefined,
            },
          },
          select: {
            fin_parcela_recebimento: {
              where: {
                HISTORICO: {
                  contains: "Baixa gerada a partir da baixa do titulo",
                },
              },
              select: {
                DATA_RECEBIMENTO: true,
                HORA_RECEBIMENTO: true,
              },
            },
          },
          orderBy: {
            ID: "desc",
          },
        });
        const recebimento = receive[0]?.fin_parcela_recebimento[0];

        if (recebimento === undefined) {
          return {
            amountLowered: undefined,
          };
        }

        const amountLowered =
          await gestorPrisma.fin_parcela_recebimento.findMany({
            where: {
              DATA_RECEBIMENTO: recebimento?.DATA_RECEBIMENTO,
              HORA_RECEBIMENTO: recebimento?.HORA_RECEBIMENTO,
            },
            select: {
              ID_COLABORADOR: true,
              DATA_RECEBIMENTO: true,
              HORA_RECEBIMENTO: true,
              VALOR_RECEBIDO: true,
            },
          });

        // Buscar nomes dos colaboradores separadamente
        type AmountLoweredRow = (typeof amountLowered)[number];
        const colaboradorIds = amountLowered
          .map((item: AmountLoweredRow) => item.ID_COLABORADOR)
          .filter((id: number | null): id is number => id !== null);

        const colaboradores = await gestorPrisma.colaborador.findMany({
          where: {
            ID: { in: colaboradorIds },
          },
          select: {
            ID: true,
            pessoa: {
              select: {
                NOME: true,
              },
            },
          },
        });

        // Criar um mapa para facilitar a busca
        type ColaboradorRow = (typeof colaboradores)[number];
        const colaboradorMap = new Map(
          colaboradores.map((col: ColaboradorRow) => [
            col.ID,
            col.pessoa?.NOME ?? null,
          ])
        );

        const groupedAmountLowered = amountLowered.reduce(
          (
            result: {
              ID_COLABORADOR: number | null;
              NOME_COLABORADOR: string | null;
              HORA_RECEBIMENTO: string | null;
              DATA_RECEBIMENTO: Date | null;
              VALOR_RECEBIDO: number;
            }[],
            row: AmountLoweredRow
          ) => {
            const amountLoweredCollaboratorId = row.ID_COLABORADOR;
            const existingAmountLowered = result.find(
              (item) => item.ID_COLABORADOR === amountLoweredCollaboratorId
            );

            if (existingAmountLowered) {
              existingAmountLowered.VALOR_RECEBIDO += Number.parseFloat(
                String(row.VALOR_RECEBIDO) || "0"
              );
            } else {
              const raw = amountLoweredCollaboratorId
                ? colaboradorMap.get(amountLoweredCollaboratorId)
                : null;
              const nomeColaborador: string | null =
                typeof raw === "string" ? raw : null;
              result.push({
                ID_COLABORADOR: amountLoweredCollaboratorId,
                NOME_COLABORADOR: nomeColaborador,
                DATA_RECEBIMENTO: row.DATA_RECEBIMENTO,
                HORA_RECEBIMENTO: row.HORA_RECEBIMENTO,
                VALOR_RECEBIDO: Number.parseFloat(
                  String(row.VALOR_RECEBIDO) || "0"
                ),
              });
            }
            return result;
          },
          []
        );

        return { amountLowered: groupedAmountLowered };
      } catch (error) {
        console.error(
          "An error occurred when returning receive total amount:",
          error
        );
        throw error;
      }
    }),
});
