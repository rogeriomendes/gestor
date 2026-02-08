"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlertIcon, ClockIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { formatDate } from "@/lib/format-date";
import { formatAsCurrency } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { DetailBudget } from "../../sales/budget/_components/DetailBudget";

function BudgetSalesSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          className="group mb-2 rounded-md p-2 transition-colors"
          key={index}
        >
          <div className="flex items-center">
            <div className="mr-3">
              <Skeleton className="top-2 h-4 w-4 animate-pulse rounded" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center">
                <Skeleton className="mr-1 h-3 w-3 animate-pulse rounded" />
                <Skeleton className="h-4 w-24 animate-pulse" />
              </div>
              <div className="flex space-x-4">
                <Skeleton className="h-3 w-20 animate-pulse" />
                {/* <Skeleton className="h-3 w-20 animate-pulse" /> */}
              </div>
            </div>
            <div className="ml-auto">
              <Skeleton className="h-4 w-16 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function BudgetSales() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const companyId = selectedCompanyId !== 0 ? selectedCompanyId : undefined;

  const budgetQuery = useQuery({
    ...trpc.tenant.salesBudget.all.queryOptions({
      limit: 30,
      situation: "D",
      companyId,
    }),
    enabled: !!tenant,
  });

  if (budgetQuery.isLoading) {
    return <BudgetSalesSkeleton />;
  }

  if (budgetQuery.error) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
        Erro ao carregar orçamentos
      </div>
    );
  }

  if (!budgetQuery.data?.budgets?.length) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
        Nenhum orçamento em digitação
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Conteúdo principal com scroll */}
      <div className="flex-1 overflow-y-auto">
        {budgetQuery.data?.budgets.map((budget: any) => (
          <div
            className="group mb-2 cursor-pointer rounded-md p-2 transition-colors hover:bg-muted/50"
            key={budget.ID}
            onClick={() => {
              setSelectedBudgetId(budget.ID);
              setIsModalOpen(true);
            }}
          >
            <div className="flex items-center">
              <div className="mr-3 w-3">
                {budget.OBSERVACAO && (
                  <CircleAlertIcon
                    aria-label="Observação"
                    className="size-4 text-blue-600 dark:text-blue-400"
                  />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-xs md:text-sm">
                  <UserIcon className="sticky mr-1 h-3 w-3" />
                  {budget.vendedor?.colaborador?.pessoa?.NOME}
                </div>
                <div className="flex space-x-4 text-muted-foreground text-sm">
                  <div className="flex items-center text-xs md:text-sm">
                    <ClockIcon className="mr-1 h-3 w-3" />
                    {budget.DATA_CADASTRO && formatDate(budget.DATA_CADASTRO)}
                  </div>
                </div>
              </div>
              <div className="ml-auto space-y-1">
                <div className="flex flex-col items-center">
                  <p className="font-medium text-xs md:text-sm">
                    {formatAsCurrency(Number(budget.VALOR_TOTAL))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal do DetailBudget */}
      {selectedBudgetId && (
        <DetailBudget
          budgetId={selectedBudgetId}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedBudgetId(null);
            }
          }}
          open={isModalOpen}
        />
      )}
    </div>
  );
}
