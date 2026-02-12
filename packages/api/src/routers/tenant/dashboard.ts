import type { Tenant } from "@gestor/db/types";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { z } from "zod";
import { router, tenantProcedure } from "../..";
import { getGestorPrismaClient } from "../../utils/tenant-db-clients";

export const dashboardRouter = router({
  getLatest30Days: tenantProcedure.query(async ({ ctx }) => {
    try {
      const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

      const today = new Date();
      const thirtyDaysAgo = new Date(subDays(today, 30));

      const salesPerDay = await gestorPrisma.venda_cabecalho.groupBy({
        by: ["DATA_VENDA"],
        _sum: { VALOR_TOTAL: true },
        where: {
          DEVOLUCAO: "N",
          CANCELADO_ID_USUARIO: { equals: null },
          DATA_VENDA: {
            gte: thirtyDaysAgo,
            lte: today,
          },
        },
      });

      type SalesPerDayRow = (typeof salesPerDay)[number];
      const totalValuePerDay = salesPerDay.map((row: SalesPerDayRow) => {
        const {
          DATA_VENDA,
          _sum: { VALOR_TOTAL },
        } = row;
        if (!DATA_VENDA) {
          throw new Error("DATA_VENDA is null");
        }
        return {
          date: format(toZonedTime(DATA_VENDA, "UTC"), "EEEEEE, dd MMM.", {
            locale: ptBR,
          }),
          total: Number(VALOR_TOTAL),
        };
      });

      return { totalValuePerDay };
    } catch (error) {
      console.error(
        "An error occurred while calculating the total value per day:",
        error
      );
      throw error;
    }
  }),

  getSalesByPeriod: tenantProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

        const sales = await gestorPrisma.venda_cabecalho.findMany({
          where: {
            DEVOLUCAO: "N",
            CANCELADO_ID_USUARIO: { equals: null },
            DATA_VENDA: {
              gte: input.startDate,
              lte: input.endDate,
            },
          },
          select: { VALOR_TOTAL: true },
        });

        const totalAmount = sales.reduce(
          (total: number, payment: { VALOR_TOTAL: unknown }) =>
            total +
            (Number.parseFloat(String(payment.VALOR_TOTAL ?? "0")) || 0),
          0
        );

        return { totalAmount };
      } catch (error) {
        console.error(
          "An error occurred when calculating the total amount for the period:",
          error
        );
        throw error;
      }
    }),

  getCurrentMonth: tenantProcedure
    .input(z.object({ companyId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      try {
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

        const today = new Date();
        const firstDateOfMonth = new Date(
          format(startOfMonth(today), "yyyy-MM-dd")
        );
        const lastDateOfMonth = new Date(
          format(endOfMonth(today), "yyyy-MM-dd")
        );

        const whereCompany =
          input.companyId && input.companyId !== 0
            ? { ID_EMPRESA: input.companyId }
            : {};

        const sales = await gestorPrisma.venda_cabecalho.findMany({
          where: {
            DEVOLUCAO: "N",
            CANCELADO_ID_USUARIO: { equals: null },
            DATA_VENDA: {
              gte: firstDateOfMonth,
              lte: lastDateOfMonth,
            },
            ...whereCompany,
          },
          select: { VALOR_TOTAL: true },
        });

        const totalAmount = sales.reduce(
          (total: number, payment: { VALOR_TOTAL: unknown }) =>
            total +
            (Number.parseFloat(String(payment.VALOR_TOTAL ?? "0")) || 0),
          0
        );

        return { totalAmount };
      } catch (error) {
        console.error(
          "An error occurred when calculating the total amount for the current month:",
          error
        );
        throw error;
      }
    }),

  getPreviousMonth: tenantProcedure
    .input(z.object({ companyId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      try {
        const gestorPrisma = getGestorPrismaClient(ctx.tenant as Tenant);

        const today = new Date();
        const previousMonth = subMonths(today, 1);
        const firstDateOfPreviousMonth = new Date(
          format(startOfMonth(previousMonth), "yyyy-MM-dd")
        );
        const lastDateOfPreviousMonth = new Date(
          format(endOfMonth(previousMonth), "yyyy-MM-dd")
        );

        const whereCompany =
          input.companyId && input.companyId !== 0
            ? { ID_EMPRESA: input.companyId }
            : {};

        const sales = await gestorPrisma.venda_cabecalho.findMany({
          where: {
            DEVOLUCAO: "N",
            CANCELADO_ID_USUARIO: { equals: null },
            DATA_VENDA: {
              gte: firstDateOfPreviousMonth,
              lte: lastDateOfPreviousMonth,
            },
            ...whereCompany,
          },
          select: { VALOR_TOTAL: true },
        });

        const totalAmount = sales.reduce(
          (total: number, payment: { VALOR_TOTAL: unknown }) =>
            total +
            (Number.parseFloat(String(payment.VALOR_TOTAL ?? "0")) || 0),
          0
        );

        return { totalAmount };
      } catch (error) {
        console.error(
          "An error occurred when calculating the total amount for the previous month:",
          error
        );
        throw error;
      }
    }),
});
