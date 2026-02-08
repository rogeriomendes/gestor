"use client";

import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { PageLayout } from "@/components/layouts/page-layout";
import { MetricCard } from "@/components/metric-card";
import { PercentDiffBadge } from "@/components/percent-diff-badge";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";
import { BudgetCard } from "./_components/BudgetCard";
import { SalesChartCard } from "./_components/SalesChartCard";

type DayValue = { date?: string; total?: number };

export default function DashboardPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();

  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => subDays(today, 30), [today]);

  const companyId = selectedCompanyId !== 0 ? selectedCompanyId : undefined;
  const enabled = !!tenant;

  const { data: latest30DaysData, isLoading: latest30DaysLoading } = useQuery({
    ...trpc.tenant.reports.salesPerDay.queryOptions({
      initialDate,
      finalDate: today,
      companyId,
    }),
    enabled,
  });
  const { data: getCurrentMonthData, isLoading: getCurrentMonthLoading } =
    useQuery({
      ...trpc.tenant.dashboard.getCurrentMonth.queryOptions({ companyId }),
      enabled,
    });
  const { data: getPreviousMonthData, isLoading: getPreviousMonthLoading } =
    useQuery({
      ...trpc.tenant.dashboard.getPreviousMonth.queryOptions({ companyId }),
      enabled,
    });

  const twoMonthsAgoStart = startOfMonth(subMonths(today, 2));
  const twoMonthsAgoEnd = endOfMonth(subMonths(today, 2));
  const { data: twoMonthsAgoData, isLoading: twoMonthsAgoLoading } = useQuery({
    ...trpc.tenant.reports.salesPerDay.queryOptions({
      initialDate: twoMonthsAgoStart,
      finalDate: twoMonthsAgoEnd,
      companyId,
    }),
    enabled,
  });
  const {
    data: totalBillsPayAmountData,
    isLoading: totalBillsPayAmountLoading,
  } = useQuery({
    ...trpc.tenant.financialBillsPay.amount.queryOptions({
      filter: "all",
      company: companyId,
    }),
    enabled,
  });

  const totalValuePerDay = latest30DaysData?.totalValuePerDay ?? [];
  const lastDay: DayValue | null =
    totalValuePerDay.length > 0
      ? (totalValuePerDay[totalValuePerDay.length - 1] ?? null)
      : null;
  const lastDayValue = lastDay?.total ? Number(lastDay.total) : 0;

  const currentDate = new Date();
  const currentMonth = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  const previousMonth = format(subMonths(currentDate, 1), "MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const twoMonthsAgoMonth = format(
    subMonths(currentDate, 2),
    "MMMM 'de' yyyy",
    {
      locale: ptBR,
    }
  );
  const currentDay = format(currentDate, "EEEE, 'dia' dd", { locale: ptBR });
  const previousWeekSameDay = format(
    subDays(currentDate, 7),
    "EEEE, 'dia' dd",
    { locale: ptBR }
  );

  const previousWeekSameDayFormatted = format(
    subDays(currentDate, 7),
    "yyyy-MM-dd"
  );
  const previousWeekDayData = totalValuePerDay.find(
    (day: DayValue) => day.date === previousWeekSameDayFormatted
  );
  const previousWeekDayValue = previousWeekDayData?.total
    ? Number(previousWeekDayData.total)
    : 0;

  const currentTotal = Number(getCurrentMonthData?.totalAmount ?? 0);
  const previousTotal = Number(getPreviousMonthData?.totalAmount ?? 0);
  const twoMonthsAgoTotal = (twoMonthsAgoData?.totalValuePerDay ?? []).reduce(
    (sum: number, d: DayValue) => sum + Number(d.total ?? 0),
    0
  );

  const comparisonPreviousVsTwoMonths = `Comparação de ${previousMonth} vs ${twoMonthsAgoMonth}`;
  const comparisonCurrentVsPrevious = `Comparação de ${currentMonth} vs ${previousMonth}`;
  const comparisonDayVsPreviousWeek = `Comparação de ${currentDay} vs ${previousWeekSameDay}`;

  return (
    <PageLayout subtitle="Visão geral do seu cliente" title="Dashboard">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4 lg:grid-cols-4">
        <MetricCard
          badge={
            <PercentDiffBadge
              currentValue={previousTotal}
              description={comparisonPreviousVsTwoMonths}
              label={comparisonPreviousVsTwoMonths}
              previousValue={twoMonthsAgoTotal}
            />
          }
          isLoading={getPreviousMonthLoading || twoMonthsAgoLoading}
          subtitle={previousMonth}
          title="Vendas do Mês Anterior"
          value={Number(getPreviousMonthData?.totalAmount)}
        />
        <MetricCard
          badge={
            <PercentDiffBadge
              currentValue={currentTotal}
              description={comparisonCurrentVsPrevious}
              label={comparisonCurrentVsPrevious}
              previousValue={previousTotal}
            />
          }
          isLoading={getCurrentMonthLoading}
          subtitle={currentMonth}
          title="Vendas do Mês"
          value={Number(getCurrentMonthData?.totalAmount)}
        />
        <MetricCard
          badge={
            <PercentDiffBadge
              currentValue={lastDayValue}
              description={comparisonDayVsPreviousWeek}
              label={comparisonDayVsPreviousWeek}
              previousValue={previousWeekDayValue}
            />
          }
          isLoading={latest30DaysLoading}
          subtitle={currentDay}
          title="Vendas do Dia"
          value={lastDayValue}
        />
        <MetricCard
          icon={ArrowUpIcon}
          iconClassName="size-5 text-red-500"
          isLoading={totalBillsPayAmountLoading}
          onClick={() => router.push("/financial/bills/pay" as Route)}
          title="Total a Pagar"
          value={Number(totalBillsPayAmountData?.totalAmount)}
        />
      </div>
      <div className="grid gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
        <SalesChartCard />
        <BudgetCard />
      </div>
    </PageLayout>
  );
}
