import type { Tenant } from "@gestor/db/types";
import { format } from "date-fns";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const financialClosingRouter = router({
  all: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        searchTerm: z.string().nullish(),
        account: z.number().nullish(),
        date: z.coerce.date().nullish(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const limit = input.limit ?? 30;
        const { cursor, account, date, companyId } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const whereAccount = account &&
          account !== 0 && {
            ID_CONTA_CAIXA: account,
          };

        const whereDate = date
          ? {
              DATA_ABERTURA: date,
            }
          : {
              DATA_ABERTURA: {
                not: null,
              },
            };

        const whereCompany =
          companyId && companyId !== 0
            ? { conta_caixa: { ID_EMPRESA: companyId } }
            : {};

        const where = {
          conta_caixa: {
            NOME: {
              not: "FINANCEIRO",
            },
          },
          ...whereAccount,
          ...whereDate,
          ...whereCompany,
        };

        const financialClosing =
          await gestorPrisma.fin_fechamento_caixa_banco.findMany({
            take: limit + 1,
            cursor: cursor ? { ID: Number(cursor) } : undefined,
            where,
            select: {
              ID: true,
              ID_CONTA_CAIXA: true,
              conta_caixa: {
                select: {
                  NOME: true,
                  ID_EMPRESA: true,
                },
              },
              HORA_ABERTURA: true,
              HORA_FECHAMENTO: true,
              DATA_ABERTURA: true,
              DATA_FECHAMENTO: true,
            },
            orderBy: {
              ID: "desc",
            },
          });

        let nextCursor: typeof cursor | undefined;
        if (financialClosing.length > limit) {
          const nextSale = financialClosing.pop();
          nextCursor = String(nextSale?.ID);
        }

        return {
          financialClosing,
          nextCursor,
        };
      } catch (error) {
        console.error("An error occurred when returning closings:", error);
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

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const closing =
          await gestorPrisma.fin_fechamento_caixa_banco.findUnique({
            where: {
              ID: Number(id),
            },
            select: {
              ID: true,
              ID_CONTA_CAIXA: true,
              conta_caixa: {
                select: {
                  NOME: true,
                },
              },
              DATA_ABERTURA: true,
              HORA_ABERTURA: true,
              DATA_FECHAMENTO: true,
              HORA_FECHAMENTO: true,
            },
          });

        return { closing };
      } catch (error) {
        console.error("An error occurred when returning closing:", error);
        throw error;
      }
    }),

  amountById: tenantProcedure
    .input(
      z.object({
        idClosing: z.number().min(1).nullish(),
        dataAbertura: z.coerce.date().nullish(),
        horaAbertura: z.string().min(1).nullish(),
        horaFechamento: z.string().min(1).nullish(),
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const {
          idClosing,
          dataAbertura,
          horaAbertura,
          horaFechamento,
          companyId,
        } = input;

        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);
        const timeNow = new Date();
        const timeFormatted = format(timeNow, "HH:mm:ss");

        const closingTime = horaFechamento || timeFormatted;

        const whereCompany =
          companyId && companyId !== 0 ? { ID_EMPRESA: companyId } : {};

        const [
          paymentsAmount,
          sangria,
          installments,
          budget,
          devolution,
          allDiscount,
        ] = await Promise.all([
          // paymentsAmount
          gestorPrisma.fin_parcela_recebimento.findMany({
            where: {
              fin_parcela_receber: {
                fin_lancamento_receber: { CANCELADO: "N" },
              },
              ID_CONTA_CAIXA: Number(idClosing),
              DATA_RECEBIMENTO: dataAbertura,
              HORA_RECEBIMENTO: {
                gte: String(horaAbertura),
                lte: String(closingTime),
              },
            },
            select: {
              ID: true,
              VALOR_RECEBIDO: true,
              ST_SUPRIMENTO: true,
              HISTORICO: true,
              HORA_RECEBIMENTO: true,
              fin_tipo_recebimento: {
                select: {
                  ID: true,
                  DESCRICAO: true,
                  TIPO: true,
                },
              },
            },
            orderBy: {
              fin_tipo_recebimento: {
                TIPO: "asc",
              },
            },
          }),
          // sangria
          gestorPrisma.fin_parcela_pagamento.findMany({
            where: {
              ST_SANGRIA: "S",
              ID_CONTA_CAIXA: Number(idClosing),
              DATA_PAGAMENTO: dataAbertura,
              HORA_PAGAMENTO: {
                gte: String(horaAbertura),
                lte: String(closingTime),
              },
            },
            select: {
              ID: true,
              VALOR_PAGO: true,
              HISTORICO: true,
              HORA_PAGAMENTO: true,
            },
            orderBy: {
              ID: "desc",
            },
          }),
          // installments
          gestorPrisma.venda_cabecalho.findMany({
            where: {
              ID_VENDA_CONDICOES_PAGAMENTO: 1,
              ID_CONTA_CAIXA: Number(idClosing),
              DATA_VENDA: dataAbertura,
              HORA_SAIDA: {
                gte: String(horaAbertura),
                lte: String(closingTime),
              },
              ...whereCompany,
            },
            select: {
              ID: true,
              PDV_CLIENTE_NOME: true,
              HORA_SAIDA: true,
              VALOR_TOTAL: true,
            },
            orderBy: {
              ID: "desc",
            },
          }),
          // budget
          gestorPrisma.venda_orcamento_cabecalho.findMany({
            where: {
              SITUACAO: "D",
              DATA_CADASTRO: dataAbertura,
            },
            select: {
              ID: true,
              VALOR_TOTAL: true,
              SITUACAO: true,
              ID_VENDEDOR: true,
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
            orderBy: { ID: "desc" },
          }),
          // devolution
          gestorPrisma.venda_cabecalho.findMany({
            where: {
              DEVOLUCAO: "S",
              ID_CONTA_CAIXA: Number(idClosing),
              DATA_VENDA: dataAbertura,
              HORA_SAIDA: {
                gte: String(horaAbertura),
                lte: String(closingTime),
              },
              ...whereCompany,
            },
            select: {
              ID: true,
              HORA_SAIDA: true,
              VALOR_TOTAL: true,
              ID_VENDEDOR: true,
              DEVOLUCAO: true,
              MOTIVO: true,
              FORMA_PAGAMENTO: true,
              venda_recebimento: {
                select: {
                  ID_FIN_TIPO_RECEBIMENTO: true,
                },
              },
            },
            orderBy: { ID: "desc" },
          }),
          // allDiscount
          gestorPrisma.venda_cabecalho.findMany({
            where: {
              ID_CONTA_CAIXA: Number(idClosing),
              DATA_VENDA: dataAbertura,
              OR: [
                {
                  VALOR_DESCONTO: {
                    gt: 0,
                  },
                },
                {
                  VALOR_ACRESCIMO: {
                    gt: 0,
                  },
                },
              ],
              HORA_SAIDA: {
                gte: String(horaAbertura),
                lte: String(closingTime),
              },
              ...whereCompany,
            },
            select: {
              ID: true,
              HORA_SAIDA: true,
              VALOR_TOTAL: true,
              ID_VENDEDOR: true,
              VALOR_ACRESCIMO: true,
              VALOR_DESCONTO: true,
            },
          }),
        ]);

        // Batch load vendedores (optimized with Set deduplication)
        const vendedorIds = [
          ...new Set([
            ...budget.map((item: any) => item.ID_VENDEDOR),
            ...devolution.map((item: any) => item.ID_VENDEDOR),
            ...allDiscount.map((item: any) => item.ID_VENDEDOR),
          ]),
        ].filter((id: any): id is number => id !== null && id !== 0);

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

        // Combinar dados com vendedores
        const budgetWithVendedor = budget.map((item: any) => ({
          ...item,
          vendedor: item.ID_VENDEDOR
            ? vendedorMap.get(item.ID_VENDEDOR) || null
            : null,
        }));

        const devolutionWithVendedor = devolution.map((item: any) => ({
          ...item,
          vendedor: item.ID_VENDEDOR
            ? vendedorMap.get(item.ID_VENDEDOR) || null
            : null,
        }));

        const allDiscountWithVendedor = allDiscount.map((item: any) => ({
          ...item,
          vendedor: item.ID_VENDEDOR
            ? vendedorMap.get(item.ID_VENDEDOR) || null
            : null,
        }));

        type PaymentAmountRow = (typeof paymentsAmount)[number];
        const paymentsDnAmount = paymentsAmount
          .filter(
            (payment: PaymentAmountRow) =>
              payment.ST_SUPRIMENTO === "N" &&
              payment.fin_tipo_recebimento?.TIPO === "DN"
          )
          .reduce(
            (total: number, payment: PaymentAmountRow) =>
              total + Number.parseFloat(String(payment.VALOR_RECEBIDO) || "0"),
            0
          );

        const groupedPaymentsAmount = paymentsAmount
          .filter((payment: PaymentAmountRow) => payment.ST_SUPRIMENTO === "N")
          .reduce(
            (
              result: {
                ID: number;
                DESCRICAO: string | null;
                TIPO: string | null;
                TOTAL: number;
              }[],
              payment: PaymentAmountRow
            ) => {
              const paymentId = payment.fin_tipo_recebimento.ID;
              const existingPayment = result.find(
                (item) => item.ID === paymentId
              );
              if (existingPayment) {
                existingPayment.TOTAL += Number.parseFloat(
                  String(payment.VALOR_RECEBIDO) || "0"
                );
              } else {
                result.push({
                  ID: paymentId,
                  DESCRICAO: payment.fin_tipo_recebimento.DESCRICAO,
                  TIPO: payment.fin_tipo_recebimento.TIPO,
                  TOTAL: Number.parseFloat(
                    String(payment.VALOR_RECEBIDO) || "0"
                  ),
                });
              }
              return result;
            },
            []
          )
          .map(
            (payment: {
              ID: number;
              DESCRICAO: string | null;
              TIPO: string | null;
              TOTAL: number;
            }) => ({
              ...payment,
              TOTAL: Number.parseFloat(String(payment.TOTAL)),
            })
          );

        const groupedPaymentsTotalAmount = groupedPaymentsAmount.reduce(
          (total: number, payment: { ID: number; TOTAL: number }) =>
            total + payment.TOTAL,
          0
        );

        const supply = paymentsAmount
          .filter((payment: PaymentAmountRow) => payment.ST_SUPRIMENTO === "S")
          .map((payment: PaymentAmountRow) => ({
            ID: payment.ID,
            VALOR_RECEBIDO: payment.VALOR_RECEBIDO,
            HISTORICO: payment.HISTORICO,
            HORA_RECEBIMENTO: payment.HORA_RECEBIMENTO,
          }));

        type DevolutionRow = (typeof devolution)[number];
        const receiptTypeId = [
          ...new Set(
            devolution
              .map(
                (row: DevolutionRow) =>
                  row.venda_recebimento[0]?.ID_FIN_TIPO_RECEBIMENTO
              )
              .filter(
                (id: number | undefined): id is number => id !== undefined
              )
          ),
        ];

        const receiptType = await gestorPrisma.fin_tipo_recebimento.findMany({
          where: {
            ID: { in: receiptTypeId },
            TIPO: "DN",
          },
          select: {
            ID: true,
            TIPO: true,
          },
        });

        type DevolutionWithVendedorRow =
          (typeof devolutionWithVendedor)[number];
        const devolutionDn = devolutionWithVendedor.filter(
          (row: DevolutionWithVendedorRow) => {
            const TypeId = row.venda_recebimento[0]?.ID_FIN_TIPO_RECEBIMENTO;
            return receiptType.some(
              (t: (typeof receiptType)[number]) => t.ID === TypeId
            );
          }
        );

        type AllDiscountRow = (typeof allDiscountWithVendedor)[number];
        const discount = allDiscountWithVendedor
          .filter((item: AllDiscountRow) => Number(item.VALOR_DESCONTO) > 0)
          .sort(
            (a: AllDiscountRow, b: AllDiscountRow) =>
              Number(b.VALOR_DESCONTO) - Number(a.VALOR_DESCONTO)
          );

        type SupplyRow = (typeof supply)[number];
        const supplyAmount = supply.reduce(
          (total: number, payment: SupplyRow) =>
            total + Number.parseFloat(String(payment.VALOR_RECEBIDO) || "0"),
          0
        );

        type SangriaRow = (typeof sangria)[number];
        const sangriaAmount = sangria.reduce(
          (total: number, payment: SangriaRow) =>
            total + Number.parseFloat(String(payment.VALOR_PAGO) || "0"),
          0
        );

        type InstallmentRow = (typeof installments)[number];
        const installmentsAmount = installments.reduce(
          (total: number, installment: InstallmentRow) =>
            total + Number.parseFloat(String(installment.VALOR_TOTAL) || "0"),
          0
        );

        type BudgetWithVendedorRow = (typeof budgetWithVendedor)[number];
        const budgetAmount = budgetWithVendedor.reduce(
          (total: number, budget: BudgetWithVendedorRow) =>
            total + Number.parseFloat(String(budget.VALOR_TOTAL) || "0"),
          0
        );

        const devolutionDnAmount = devolutionDn.reduce(
          (total: number, devolution: DevolutionWithVendedorRow) =>
            total + Number.parseFloat(String(devolution.VALOR_TOTAL) || "0"),
          0
        );

        const devolutionAmount = devolutionWithVendedor.reduce(
          (total: number, devolution: DevolutionWithVendedorRow) =>
            total + Number.parseFloat(String(devolution.VALOR_TOTAL) || "0"),
          0
        );

        const discountAmount = allDiscountWithVendedor.reduce(
          (total: number, discount: AllDiscountRow) =>
            total + Number.parseFloat(String(discount.VALOR_DESCONTO) || "0"),
          0
        );

        return {
          paymentsDnAmount,
          groupedPaymentsTotalAmount,
          groupedPaymentsAmount,
          supplyAmount,
          supply,
          sangriaAmount,
          sangria,
          installmentsAmount,
          installments,
          budgetAmount,
          budget: budgetWithVendedor,
          devolutionDnAmount,
          devolutionAmount,
          devolution: devolutionWithVendedor,
          discountAmount,
          discount,
        };
      } catch (error) {
        console.error(
          "An error occurred when returning closing amount:",
          error
        );
        throw error;
      }
    }),
});
