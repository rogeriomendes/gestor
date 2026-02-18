"use client";

import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { getBudgetSituationInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Settings2Icon, SheetIcon, UserIcon } from "lucide-react";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { BudgetGrid } from "./_components/BudgetGrid";
import { DetailBudget } from "./_components/DetailBudget";

type BudgetItem =
  RouterOutputs["tenant"]["salesBudget"]["all"]["budgets"][number];

export default function BudgetList() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [seller, setSeller] = useState<string>("0");
  const [situation, setSituation] = useState<string>("T");
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const enabled = !!tenant;

  const salesBudgetQuery = useInfiniteQuery({
    ...trpc.tenant.salesBudget.all.infiniteQueryOptions({
      limit: 20,
      searchTerm: search,
      situation: situation !== "T" ? situation : undefined,
      seller: seller !== "0" ? Number(seller) : undefined,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

  const sellerQuery = useQuery({
    ...trpc.tenant.seller.all.queryOptions(),
    enabled,
  });

  const sellerList = (sellerQuery.data?.sellers ?? []) as Array<{
    ID: number;
    colaborador?: { pessoa?: { NOME?: string | null } } | null;
  }>;
  const sellerOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "0", label: "TODOS" },
      ...sellerList.map((item) => ({
        value: String(item.ID),
        label: item.colaborador?.pessoa?.NOME ?? "",
      })),
    ],
    [sellerList]
  );

  const situationOptions: ComboboxOption[] = [
    { value: "T", label: "TODOS" },
    { value: "F", label: "FATURADO" },
    { value: "D", label: "DIGITAÇÃO" },
    { value: "C", label: "CANCELADO" },
  ];

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" as Route },
        { label: "Vendas", href: "/sales" as Route },
        { label: "Orçamento e Pedido", isCurrent: true },
      ]}
      subtitle="Consulte orçamentos e pedidos de venda"
      title="Orçamento e Pedido"
    >
      <div className="flex flex-col md:flex-row md:items-center">
        <SearchInput
          enableF9Shortcut
          onChange={setSearch}
          placeholder="Pesquisa por ID e Cliente"
          value={search}
        />
        <div className="mt-2 flex flex-row gap-2 md:mt-0 md:ml-3 md:gap-3">
          <Combobox
            className="flex-1 md:w-48"
            icon={<UserIcon />}
            onValueChange={setSeller}
            options={sellerOptions}
            placeholder="Vendedor"
            searchPlaceholder="Buscar vendedor..."
            value={seller}
          />
          <Combobox
            className="flex-1 md:w-48"
            icon={<Settings2Icon />}
            onValueChange={setSituation}
            options={situationOptions}
            placeholder="Situação"
            searchPlaceholder="Buscar situação..."
            value={situation}
          />
        </div>
      </div>
      {isMobile ? (
        <BudgetGrid
          data={salesBudgetQuery.data?.pages}
          emptyIcon={<SheetIcon className="mb-4 size-12" />}
          emptyMessage="Não foram encontrados orçamentos."
          fetchNextPage={salesBudgetQuery.fetchNextPage}
          hasNextPage={salesBudgetQuery.hasNextPage}
          isFetchingNextPage={salesBudgetQuery.isFetchingNextPage}
          isLoading={salesBudgetQuery.isLoading}
          loadingMessage="Carregando orçamentos..."
          loadMoreMessage="Carregar mais orçamentos"
          noMoreDataMessage="Não há mais orçamentos para carregar"
          onBudgetClick={(budget: BudgetItem) => {
            setSelectedBudgetId(budget.ID);
            setIsModalOpen(true);
          }}
          pageItemKeys={["budgets", "items"]}
        />
      ) : (
        <DataTableInfinite<BudgetItem>
          data={salesBudgetQuery.data?.pages}
          emptyIcon={<SheetIcon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontrados Orçamentos."
          fetchNextPage={salesBudgetQuery.fetchNextPage}
          getRowKey={(budget) => budget.ID}
          hasNextPage={salesBudgetQuery.hasNextPage}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            {
              key: "empresa",
              label: "Emp.",
              className: "hidden sm:table-cell",
            },
            { key: "id", label: "ID", className: "hidden sm:table-cell" },
            { key: "vendedor", label: "Vendedor", className: "" },
            { key: "cliente", label: "Cliente", className: "" },
            { key: "situacao", label: "Situação", className: "" },
            { key: "valor", label: "Vlr. Total", className: "" },
            { key: "alteracao", label: "Alteração", className: "" },
            { key: "observacao", label: "Observação", className: "" },
          ]}
          isFetchingNextPage={salesBudgetQuery.isFetchingNextPage}
          // getRowClassName={(budget: any) => {
          //   return `${budget.SITUACAO === "C" ? "text-red-500" : ""} ${budget.SITUACAO === "D" ? "text-yellow-500" : ""}`
          // }}
          isLoading={salesBudgetQuery.isLoading}
          loadingMessage="Carregando mais orçamentos..."
          loadMoreMessage="Carregar mais orçamentos"
          noMoreDataMessage="Não há mais orçamentos para carregar"
          onRowClick={(budget) => {
            setSelectedBudgetId(budget.ID);
            setIsModalOpen(true);
          }}
          pageItemKeys={["budgets"]}
          renderRow={(budget: BudgetItem) => {
            // Verificar se o orçamento existe
            if (!budget) {
              return null;
            }

            // Status do orçamento
            const statusInfo = getBudgetSituationInfo(budget.SITUACAO);

            return [
              "",
              budget.ID_EMPRESA,
              budget.ID,
              budget.vendedor?.colaborador?.pessoa?.NOME,
              budget.cliente.pessoa.NOME,
              <Badge
                className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
                key={budget.ID}
                variant={statusInfo.variant}
              >
                {statusInfo.label}
              </Badge>,
              formatAsCurrency(Number(budget.VALOR_TOTAL)),
              budget.ALTERACAO_DATA_HORA &&
              formatDate(budget.ALTERACAO_DATA_HORA),
              budget.OBSERVACAO,
            ];
          }}
        />
      )}

      {/* Modal de detalhes do orçamento */}
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
    </PageLayout>
  );
}
