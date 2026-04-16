"use client";

import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FiltersPanel } from "@/components/ui/filters-panel";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { getBudgetSituationInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  FilterIcon,
  FilterXIcon,
  Settings2Icon,
  SheetIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import type { Route } from "next";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { BudgetGrid } from "./_components/BudgetGrid";
import { DetailBudget } from "./_components/DetailBudget";

type BudgetItem =
  RouterOutputs["tenant"]["salesBudget"]["all"]["budgets"][number];

export default function BudgetList() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const isMobile = useIsMobile();
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [seller, setSeller] = useQueryState("seller", { defaultValue: "0" });
  const [situation, setSituation] = useQueryState("situation", {
    defaultValue: "T",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const enabled = !!tenant;

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const salesBudgetQuery = useInfiniteQuery({
    ...trpc.tenant.salesBudget.all.infiniteQueryOptions(
      {
        limit: 20,
        searchTerm: debouncedSearch || null,
        situation: situation !== "T" ? situation : null,
        seller: seller !== "0" ? Number(seller) : null,
        companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialCursor: null,
      }
    ),
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

  const sellerLabel = sellerOptions.find((o) => o.value === seller)?.label;
  const situationLabel = situationOptions.find(
    (o) => o.value === situation
  )?.label;

  const hasActiveFilters =
    search.trim().length > 0 || seller !== "0" || situation !== "T";

  const clearAllFilters = () => {
    void setSearch("");
    void setSeller("0");
    void setSituation("T");
  };

  const filtersContent = (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Combobox
          className="w-full"
          icon={<UserIcon />}
          onValueChange={(v) => void setSeller(v)}
          options={sellerOptions}
          placeholder="Vendedor"
          searchPlaceholder="Buscar vendedor..."
          value={seller}
        />
        <Combobox
          className="w-full"
          icon={<Settings2Icon />}
          onValueChange={(v) => void setSituation(v)}
          options={situationOptions}
          placeholder="Situação"
          searchPlaceholder="Buscar situação..."
          value={situation}
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={clearAllFilters}
          size="sm"
          type="button"
          variant="ghost"
        >
          <FilterXIcon className="mr-1 h-3 w-3" />
          Limpar
        </Button>
      </div>
    </div>
  );

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
      <div className="flex gap-2">
        <SearchInput
          className="w-full md:w-96"
          enableF9Shortcut
          onChange={(v) => void setSearch(v)}
          placeholder="Pesquisa por ID e Cliente"
          value={search}
        />
        <FiltersPanel
          onOpenChange={setFiltersOpen}
          open={filtersOpen}
          title="Filtros de orçamento"
          triggerIcon={<FilterIcon className="size-4 md:mr-2" />}
        >
          {filtersContent}
        </FiltersPanel>
      </div>
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1">
          {search.trim().length > 0 && (
            <Badge className="gap-1 pr-1" variant="secondary">
              Busca: {search.trim()}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => void setSearch("")}
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {seller !== "0" && (
            <Badge className="gap-1 pr-1" variant="secondary">
              Vendedor: {sellerLabel}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => void setSeller("0")}
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {situation !== "T" && (
            <Badge className="gap-1 pr-1" variant="secondary">
              Situação: {situationLabel}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => void setSituation("T")}
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            className="md:h-8 md:text-sm md:[&_svg:not([class*='size-'])]:size-4"
            onClick={clearAllFilters}
            size="xs"
            variant="ghost"
          >
            <FilterXIcon className="mr-0.5 h-3 w-3" />
            Limpar
          </Button>
        </div>
      )}
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
            { key: "criacao", label: "Criação", className: "" },
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
              (budget.DATA_CADASTRO && formatDate(budget.DATA_CADASTRO)) || "—",
              (budget.ALTERACAO_DATA_HORA &&
                formatDate(budget.ALTERACAO_DATA_HORA)) ||
              "—",
              budget.OBSERVACAO || "—",
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
