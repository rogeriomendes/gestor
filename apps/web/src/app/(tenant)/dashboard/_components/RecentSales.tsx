"use client";

import { useQuery } from "@tanstack/react-query";
import { ClockIcon, Loader2Icon, UserIcon } from "lucide-react";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { formatAsCurrency } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { DetailSales } from "../../sales/list/_components/DetailSales";

export function RecentSales() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const companyId = selectedCompanyId !== 0 ? selectedCompanyId : undefined;
  const {
    data: salesData,
    isLoading: salesLoading,
    isFetching: salesFetching,
  } = useQuery({
    ...trpc.tenant.sales.all.queryOptions({
      limit: 30,
      companyId,
    }),
    enabled: !!tenant,
  });
  return (
    <>
      {salesFetching && (
        <span className="flex items-center justify-center">
          <Loader2Icon className="mr-2 size-4 animate-spin" />
        </span>
      )}
      {(salesData as { sales?: unknown[] } | undefined)?.sales?.map(
        (sales: any) => (
          <div
            className="group mb-2 rounded-md p-2 transition-colors hover:bg-muted/50"
            key={sales.ID}
          >
            <div className="flex items-center">
              <div className="mr-3">
                <DetailSales saleId={sales.ID} />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm leading-none">
                  Venda {sales.ID}
                </p>
                <div className="flex space-x-4 text-muted-foreground text-sm">
                  <div className="flex items-center">
                    <UserIcon className="mr-1 h-3 w-3" />
                    {sales.conta_caixa?.NOME}
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="mr-1 h-3 w-3" />
                    {sales.HORA_SAIDA}
                  </div>
                </div>
              </div>
              <div className="ml-auto space-y-1">
                <div className="flex flex-col items-center">
                  <p className="font-medium text-sm">
                    {formatAsCurrency(Number(sales.VALOR_TOTAL))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </>
  );
}
