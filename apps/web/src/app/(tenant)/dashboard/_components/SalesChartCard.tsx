"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";
import { Overview } from "./Overview";

function SalesChartSkeleton() {
  const [bars, setBars] = useState<string[]>([]);

  useEffect(() => {
    const heights = [
      "h-28",
      "h-36",
      "h-48",
      "h-56",
      "h-64",
      "h-72",
      "h-80",
    ] as const;

    setBars(
      Array.from(
        { length: 30 },
        () => heights[Math.floor(Math.random() * heights.length)]!
      )
    );
  }, []);

  return (
    <Card className="col-span-4 rounded-md">
      <CardHeader>
        <CardTitle className="flex flex-row items-center">
          Vendas dos últimos 30 dias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[370px] w-full items-end gap-2">
          {bars.map((h, i) => (
            <Skeleton className={`w-full animate-pulse ${h}`} key={i} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SalesChartCard() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const today = useMemo(() => new Date(), []);
  const initialDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, []);

  const companyId = selectedCompanyId !== 0 ? selectedCompanyId : undefined;

  const {
    data: latest30DaysData,
    isLoading: latest30DaysLoading,
    isFetching: latest30DaysFetching,
    error: latest30DaysError,
  } = useQuery({
    ...trpc.tenant.reports.salesPerDay.queryOptions({
      initialDate,
      finalDate: today,
      companyId,
    }),
    enabled: !!tenant,
  });

  if (latest30DaysLoading) {
    return <SalesChartSkeleton />;
  }

  if (latest30DaysError) {
    return (
      <Card className="col-span-4 rounded-md">
        <CardHeader className="px-3 md:px-5">
          <CardTitle>Vendas dos últimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            Erro ao carregar dados de vendas
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latest30DaysData?.totalValuePerDay?.length) {
    return (
      <Card className="col-span-4 rounded-md py-3 md:py-5">
        <CardHeader>
          <CardTitle>Vendas dos últimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
            Nenhuma venda encontrada nos últimos 30 dias
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-4 rounded-md">
      <CardHeader className="px-3 md:px-5">
        <CardTitle className="flex flex-row items-center">
          Vendas dos últimos 30 dias
          {latest30DaysFetching && (
            <Loader2Icon className="ml-2 size-4 animate-spin" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Overview data={latest30DaysData.totalValuePerDay} />
      </CardContent>
    </Card>
  );
}
