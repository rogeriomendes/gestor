"use client";

import { PageLayout } from "@/components/layouts/page-layout";
import { MetricCard } from "@/components/metric-card";
import { PercentDiffBadge } from "@/components/percent-diff-badge";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { BudgetCard } from "./_components/BudgetCard";
import { SalesChartCard } from "./_components/SalesChartCard";

interface DayValue {
  date?: string;
  total?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();

  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => subDays(today, 30), [today]);

  const companyId = selectedCompanyId !== 0 ? selectedCompanyId : undefined;
  const enabled = !!tenant;

  // Meses anteriores para comparação
  const twoMonthsAgoStart = useMemo(() => startOfMonth(subMonths(today, 2)), [today]);
  const twoMonthsAgoEnd = useMemo(() => endOfMonth(subMonths(today, 2)), [today]);

  // Labels de data — calculados uma única vez (useMemo evita recálculo a cada render)
  const dateLabels = useMemo(() => {
    const now = new Date();
    const currentMonth = format(now, "MMMM 'de' yyyy", { locale: ptBR });
    const previousMonth = format(subMonths(now, 1), "MMMM 'de' yyyy", { locale: ptBR });
    const twoMonthsAgoMonth = format(subMonths(now, 2), "MMMM 'de' yyyy", { locale: ptBR });
    const currentDay = format(now, "EEEE, 'dia' dd", { locale: ptBR });
    const previousWeekSameDay = format(subDays(now, 7), "EEEE, 'dia' dd", { locale: ptBR });
    const previousWeekSameDayFormatted = format(subDays(now, 7), "yyyy-MM-dd");
    return {
      currentMonth,
      previousMonth,
      twoMonthsAgoMonth,
      currentDay,
      previousWeekSameDay,
      previousWeekSameDayFormatted,
    };
  }, []);

  // Vendas dos últimos 30 dias (para métricas do dia — SalesChartCard faz sua própria query)
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
    totalValuePerDay.length > 0 ? (totalValuePerDay.at(-1) ?? null) : null;
  const lastDayValue = lastDay?.total ? Number(lastDay.total) : 0;

  const previousWeekDayData = totalValuePerDay.find(
    (day: DayValue) => day.date === dateLabels.previousWeekSameDayFormatted
  );
  const previousWeekDayValue = previousWeekDayData?.total
    ? Number(previousWeekDayData.total)
    : 0;

  const currentTotal = Number(getCurrentMonthData?.totalAmount ?? 0);
  const previousTotal = Number(getPreviousMonthData?.totalAmount ?? 0);

  // Agregação client-side do mês retrasado (memoizada para evitar recálculo a cada render)
  const twoMonthsAgoTotal = useMemo(
    () =>
      (twoMonthsAgoData?.totalValuePerDay ?? []).reduce(
        (sum: number, d: DayValue) => sum + Number(d.total ?? 0),
        0
      ),
    [twoMonthsAgoData]
  );

  const comparisonPreviousVsTwoMonths = `Comparação de ${dateLabels.previousMonth} vs ${dateLabels.twoMonthsAgoMonth}`;
  const comparisonCurrentVsPrevious = `Comparação de ${dateLabels.currentMonth} vs ${dateLabels.previousMonth}`;
  const comparisonDayVsPreviousWeek = `Comparação de ${dateLabels.currentDay} vs ${dateLabels.previousWeekSameDay}`;

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", isCurrent: true },
        { label: "Overview", isCurrent: true },
      ]}
      subtitle="Visão geral do seu cliente"
      title="Dashboard"
    >
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
          subtitle={dateLabels.previousMonth}
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
          subtitle={dateLabels.currentMonth}
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
          subtitle={dateLabels.currentDay}
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
