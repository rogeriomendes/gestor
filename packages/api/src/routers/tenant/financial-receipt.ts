import { format } from "date-fns";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const financialReceiptRouter = router({
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
        sortOrder: z.enum(["asc", "desc"]).nullish(),
        sortField: z
          .enum(["valor", "tipo_pagamento", "serie_nfe"]) // campos suportados (NFe removido)
          .nullish(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input.limit ?? 30;

        const {
          cursor,
          sortOrder,
          sortField,
          companyId,
          dataAbertura,
          horaAbertura,
          horaFechamento,
          idClosing,
        } = input;

        const timeNow = new Date();
        const timeFormatted = format(timeNow, "HH:mm:ss");
        const closingTime = horaFechamento || timeFormatted;

        // Filtro por empresa através da venda_cabecalho
        const whereCompany =
          companyId && companyId !== 0
            ? { venda_cabecalho: { ID_EMPRESA: companyId } }
            : {};

        // Filtro por conta/fechamento via venda_cabecalho (ID_CONTA_CAIXA fica na venda)
        const whereClosing =
          idClosing && idClosing !== 0
            ? { venda_cabecalho: { ID_CONTA_CAIXA: idClosing } }
            : {};

        // Filtro por data e horário
        const whereDate =
          dataAbertura && horaAbertura
            ? {
                DATA_ABERTURA_CAIXA: dataAbertura,
                HORA_ABERTURA_CAIXA: {
                  gte: horaAbertura,
                  lte: closingTime,
                },
              }
            : {};

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as any);
        const where = {
          ...whereCompany,
          ...whereClosing,
          ...whereDate,
        };

        const orderBy: { [key: string]: unknown }[] = [];

        if (sortOrder && sortField) {
          if (sortField === "valor") {
            orderBy.push({ VALOR_RECEBIDO: sortOrder });
          } else if (sortField === "tipo_pagamento") {
            // Ordena pela forma de pagamento (ID) conforme solicitado
            orderBy.push({ ID_FIN_TIPO_RECEBIMENTO: sortOrder });
          } else if (sortField === "serie_nfe") {
            orderBy.push({ venda_cabecalho: { SERIE_NFE: sortOrder } });
          }
          // Base de ordenação por hora da saída (mesma direção)
          orderBy.push({ venda_cabecalho: { HORA_SAIDA: sortOrder } });
        } else {
          // Ordenação padrão por DATA_VENDA e HORA_SAIDA da venda
          orderBy.push(
            { venda_cabecalho: { DATA_VENDA: "desc" } },
            { venda_cabecalho: { HORA_SAIDA: "desc" } }
          );
        }
        // Desempate por ID para ordem estável
        orderBy.push({ ID: "asc" });

        // Paginação por offset: cursor representa o deslocamento (skip)
        const offset = cursor ? Number.parseInt(cursor, 10) : 0;

        const receipts = await gestorPrisma.venda_recebimento.findMany({
          where,
          skip: offset,
          take: limit + 1,
          orderBy,
          select: {
            ID: true,
            ID_VENDA_CABECALHO: true,
            ID_FIN_TIPO_RECEBIMENTO: true,
            VALOR_RECEBIDO: true,
            VALOR_DINHEIRO: true,
            VALOR_TROCO: true,
            AUTORIZACAO_CARTAO_VENDA: true,
            COD_BARRA_VALE_COMPRA: true,
            DATA_ABERTURA_CAIXA: true,
            HORA_ABERTURA_CAIXA: true,
            TAXA_ADICIONAL: true,
            venda_cabecalho: {
              select: {
                ID: true,
                ID_CONTA_CAIXA: true,
                NUMERO_NFE: true,
                SERIE_NFE: true,
                NFCE: true,
                HORA_SAIDA: true,
                VALOR_TOTAL: true,
                DATA_VENDA: true,
                DEVOLUCAO: true,
                CANCELADO_ID_USUARIO: true,
                cliente: {
                  select: {
                    pessoa: {
                      select: {
                        NOME: true,
                      },
                    },
                  },
                },
                nfe_cabecalho: {
                  select: {
                    STATUS_NOTA: true,
                  },
                },
              },
            },
          },
        });

        // Batch load tipos de recebimento (optimized with Set deduplication)
        type ReceiptRow = (typeof receipts)[number];
        const tipoRecebimentoIds = [
          ...new Set(
            receipts
              .map((r: ReceiptRow) => r.ID_FIN_TIPO_RECEBIMENTO)
              .filter((id): id is number => id !== null)
          ),
        ];

        const tiposRecebimento =
          await gestorPrisma.fin_tipo_recebimento.findMany({
            where: {
              ID: {
                in: tipoRecebimentoIds,
              },
            },
            select: {
              ID: true,
              TIPO: true,
              DESCRICAO: true,
              FORMA: true,
              TAXA_CREDITO: true,
              TAXA_DEBITO: true,
              TAXA_PARCELADO: true,
            },
          });

        // Mapear os tipos de recebimento para os recebimentos
        type TipoRecebimentoRow = (typeof tiposRecebimento)[number];
        const receiptsWithTipo = receipts.map((receipt: ReceiptRow) => ({
          ...receipt,
          fin_tipo_recebimento:
            tiposRecebimento.find(
              (tipo: TipoRecebimentoRow) =>
                tipo.ID === receipt.ID_FIN_TIPO_RECEBIMENTO
            ) ?? null,
        }));

        // Agrupar recebimentos por venda e calcular sequência das formas de pagamento
        const vendaGroups = new Map<
          number,
          (typeof receiptsWithTipo)[number][]
        >();

        type ReceiptWithTipoRow = (typeof receiptsWithTipo)[number];
        receiptsWithTipo.forEach((receipt: ReceiptWithTipoRow) => {
          const vendaId = receipt.ID_VENDA_CABECALHO;
          if (!vendaGroups.has(vendaId)) {
            vendaGroups.set(vendaId, []);
          }
          vendaGroups.get(vendaId)?.push(receipt);
        });

        // Ordenar recebimentos dentro de cada venda por DATA_VENDA e adicionar sequência
        const receiptsWithSequencia = receiptsWithTipo.map(
          (receipt: ReceiptWithTipoRow) => {
            const vendaReceipts = vendaGroups.get(receipt.ID_VENDA_CABECALHO)!;
            const sortedReceipts = vendaReceipts.sort(
              (a: ReceiptWithTipoRow, b: ReceiptWithTipoRow) => {
                const dataA = a.venda_cabecalho?.DATA_VENDA;
                const dataB = b.venda_cabecalho?.DATA_VENDA;

                if (!(dataA || dataB)) {
                  return 0;
                }
                if (!dataA) {
                  return 1;
                }
                if (!dataB) {
                  return -1;
                }

                // Primeiro critério: DATA_VENDA
                const dataComparison =
                  new Date(dataA).getTime() - new Date(dataB).getTime();
                if (dataComparison !== 0) {
                  return dataComparison;
                }

                // Segundo critério: HORA_SAIDA
                const horaA = a.venda_cabecalho?.HORA_SAIDA;
                const horaB = b.venda_cabecalho?.HORA_SAIDA;
                if (horaA && horaB) {
                  const horaComparison = horaA.localeCompare(horaB);
                  if (horaComparison !== 0) {
                    return horaComparison;
                  }
                }

                // Terceiro critério: ID do recebimento (para garantir ordem consistente)
                return a.ID - b.ID;
              }
            );
            const sequencia =
              sortedReceipts.findIndex(
                (r: ReceiptWithTipoRow) => r.ID === receipt.ID
              ) + 1;

            return {
              ...receipt,
              SEQUENCIA_FORMA_PAGAMENTO: sequencia,
              TOTAL_FORMAS_PAGAMENTO: sortedReceipts.length,
            };
          }
        );

        let nextCursor: typeof cursor | undefined;
        if (receiptsWithSequencia.length > limit) {
          receiptsWithSequencia.pop();
          nextCursor = (offset + limit).toString();
        }

        return {
          receipts: receiptsWithSequencia,
          nextCursor,
        };
      } catch (error) {
        console.error(
          "An error occurred when returning financial receipts:",
          error
        );
        throw error;
      }
    }),
});
