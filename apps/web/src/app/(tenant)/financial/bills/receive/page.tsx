"use client";

import { useQuery } from "@tanstack/react-query";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { BreadcrumbItemType } from "@/components/breadcrumbs";
import { PageLayout } from "@/components/layouts/page-layout";
import { useTenant } from "@/contexts/tenant-context";
import { trpc } from "@/utils/trpc";
import ReceiveClients from "./_components/ReceiveClients";
import ReceiveClientsMobile from "./_components/ReceiveClientsMobile";
import ReceiveSalesList from "./_components/ReceiveSales";

export default function FinancialBillsReceive() {
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  const clientId = searchParams.get("clientId");

  const clientQuery = useQuery({
    ...trpc.tenant.client.byId.queryOptions({
      id: clientId ? Number(clientId) : undefined,
    }),
    enabled: !!tenant && !!clientId,
  });

  const breadcrumbs: BreadcrumbItemType[] = useMemo(() => {
    const base: BreadcrumbItemType[] = [
      { label: "Dashboard", href: "/dashboard" as Route },
      { label: "Financeiro", href: "/financial" as Route },
    ];
    if (clientId && clientQuery.data?.client?.pessoa?.NOME) {
      return [
        ...base,
        {
          label: "Contas a Receber",
          href: "/financial/bills/receive" as Route,
        },
        { label: clientQuery.data.client.pessoa.NOME, isCurrent: true },
      ];
    }
    return [...base, { label: "Contas a Receber", isCurrent: true }];
  }, [clientId, clientQuery.data?.client?.pessoa?.NOME]);

  return (
    <PageLayout
      breadcrumbs={breadcrumbs}
      subtitle="Consulte os recebimentos e contas pendentes"
      title="Contas a Receber"
    >
      <div className="flex flex-1 flex-col gap-2 md:flex-row md:gap-4">
        <div className="hidden w-full sm:block md:w-1/3 md:max-w-[500px]">
          <ReceiveClients />
        </div>
        <div className="w-full sm:hidden">
          <ReceiveClientsMobile />
        </div>
        <div className="w-full gap-2 md:w-2/3 md:gap-4">
          <ReceiveSalesList />
        </div>
      </div>
    </PageLayout>
  );
}
