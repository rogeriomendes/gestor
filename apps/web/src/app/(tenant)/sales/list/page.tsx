"use client";

import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePickerTimeRange } from "@/components/ui/date-picker-time-range";
import { FiltersPanel } from "@/components/ui/filters-panel";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { getNfceStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency, removeLeadingZero } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  FilterIcon,
  FilterXIcon,
  ShoppingCartIcon,
  SquareUserIcon,
  XIcon,
} from "lucide-react";
import type { Route } from "next";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { DetailSales } from "./_components/DetailSales";
import { SalesGrid } from "./_components/SalesGrid";

type SaleItem = RouterOutputs["tenant"]["sales"]["all"]["sales"][number];

export default function SalesList() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const isMobile = useIsMobile();
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [account, setAccount] = useQueryState("account", { defaultValue: "0" });
  const [date, setDate] = useQueryState("date", parseAsIsoDate);
  const [timeFrom, setTimeFrom] = useQueryState("timeFrom", {
    defaultValue: "",
  });
  const [timeTo, setTimeTo] = useQueryState("timeTo", {
    defaultValue: "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Lazy initial state — evita flash de conteúdo vazio sem useEffect
  const [isMounted] = useState(true);

  const enabled = !!tenant;

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => {
      clearTimeout(id);
    };
  }, [search]);

  const dateFormatted =
    date instanceof Date
      ? new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      )
      : undefined;

  const salesQuery = useInfiniteQuery({
    ...trpc.tenant.sales.all.infiniteQueryOptions(
      {
        limit: 20,
        searchTerm: debouncedSearch || null,
        date: dateFormatted ?? null,
        timeFrom: timeFrom || null,
        timeTo: timeTo || null,
        account: account !== "0" ? Number(account) : null,
        companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialCursor: null,
      }
    ),
    enabled,
  });

  const accountsQuery = useQuery({
    ...trpc.tenant.account.all.queryOptions({
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    enabled,
  });

  const accountsList = (accountsQuery.data?.accounts ?? []) as Array<{
    ID: number;
    NOME: string | null;
  }>;
  const accountsOptions: ComboboxOption[] = [
    { value: "0", label: "TODOS" },
    ...accountsList.map((item) => ({
      value: String(item.ID),
      label: item.NOME ?? "",
    })),
  ];
  const accountLabel = accountsOptions.find(
    (item) => item.value === account
  )?.label;
  const hasDateOrTimeFilter = !!date || !!timeFrom || !!timeTo;
  const hasActiveFilters =
    search.trim().length > 0 || account !== "0" || hasDateOrTimeFilter;

  const clearAllFilters = () => {
    void setSearch("");
    void setAccount("0");
    void setDate(null);
    void setTimeFrom("");
    void setTimeTo("");
  };

  const filtersContent = (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Combobox
          className="w-full"
          icon={<SquareUserIcon />}
          onValueChange={setAccount}
          options={accountsOptions}
          placeholder="Conta caixa"
          searchPlaceholder="Buscar conta caixa..."
          value={account}
        />
        <DatePickerTimeRange
          className="w-full"
          date={date ?? undefined}
          onDateChange={(d) => void setDate(d ?? null)}
          onTimeFromChange={(value) => void setTimeFrom(value)}
          onTimeToChange={(value) => void setTimeTo(value)}
          placeholder="Data e horário"
          timeFrom={timeFrom}
          timeTo={timeTo}
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
        { label: "Vendas", href: "/sales" as Route, isCurrent: true },
        { label: "Gestão de Vendas", isCurrent: true },
      ]}
      subtitle="Consulte as vendas realizadas"
      title="Vendas"
    >
      <div className="flex gap-2">
        <SearchInput
          className="w-full md:w-96"
          enableF9Shortcut
          onChange={(v: string) => setSearch(v)}
          placeholder="Pesquisa por ID e Número NFCe"
          value={search}
        />
        <FiltersPanel
          onOpenChange={setFiltersOpen}
          open={filtersOpen}
          title="Filtros de vendas"
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
          {account !== "0" && (
            <Badge className="gap-1 pr-1" variant="secondary">
              Conta: {accountLabel}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => void setAccount("0")}
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {hasDateOrTimeFilter && (
            <Badge className="gap-1 pr-1" variant="secondary">
              {`Data/hora: ${date ? formatDate(date, true) : "Todas"} ${timeFrom || "00:00"}-${timeTo || "23:59"}`}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => {
                  void setDate(null);
                  void setTimeFrom("");
                  void setTimeTo("");
                }}
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
        <SalesGrid
          data={salesQuery.data?.pages}
          emptyIcon={<ShoppingCartIcon className="mb-4 size-12" />}
          emptyMessage="Não foram encontradas vendas."
          fetchNextPage={salesQuery.fetchNextPage}
          hasNextPage={salesQuery.hasNextPage}
          isFetchingNextPage={salesQuery.isFetchingNextPage}
          isLoading={salesQuery.isLoading}
          loadingMessage="Carregando vendas..."
          loadMoreMessage="Carregar mais vendas"
          noMoreDataMessage="Não há mais vendas para carregar"
          onSaleClick={(sale: SaleItem) => {
            setSelectedSaleId(sale.ID);
            setIsModalOpen(true);
          }}
          pageItemKeys={["sales", "items"]}
        />
      ) : (
        <DataTableInfinite<SaleItem>
          data={salesQuery.data?.pages}
          emptyIcon={<ShoppingCartIcon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontrados vendas."
          fetchNextPage={salesQuery.fetchNextPage}
          getRowKey={(sale) => sale.ID}
          hasNextPage={salesQuery.hasNextPage}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            {
              key: "empresa",
              label: "Emp.",
              className: "hidden sm:table-cell",
            },
            {
              key: "numero",
              label: "Número",
              className: "hidden sm:table-cell",
            },
            { key: "conta", label: "Conta Caixa", className: "" },
            { key: "cliente", label: "Cliente", className: "" },
            { key: "status", label: "Status", className: "" },
            { key: "data", label: "Data", className: "" },
            { key: "valor", label: "Vlr. Total", className: "" },
            {
              key: "nfce",
              label: "Núm. NFCe",
              className: "hidden sm:table-cell",
            },
            {
              key: "serie",
              label: "Série NFCe",
              className: "hidden sm:table-cell",
            },
          ]}
          isFetchingNextPage={salesQuery.isFetchingNextPage}
          // getRowClassName={(sale: any) => {
          //   return cn(
          //     sale.DEVOLUCAO === "S" || sale.CANCELADO_ID_USUARIO
          //       ? "text-red-500"
          //       : "",
          //     sale.nfe_cabecalho?.[0]?.STATUS_NOTA === "7" && "text-yellow-500",
          //     sale.nfe_cabecalho?.[0]?.STATUS_NOTA === "9" && "text-blue-500",
          //   )
          // }}
          isLoading={salesQuery.isLoading}
          loadingMessage="Carregando mais vendas..."
          loadMoreMessage="Carregar mais vendas"
          noMoreDataMessage="Não há mais vendas para carregar"
          onRowClick={(sale) => {
            setSelectedSaleId(sale.ID);
            setIsModalOpen(true);
          }}
          pageItemKeys={["sales"]}
          renderRow={(sale: SaleItem) => {
            // Verificar se a venda existe
            if (!sale) {
              return null;
            }

            // Nota: o filtro de busca é aplicado no servidor (searchTerm no input da query)
            // Relações que podem vir da API mas não estão no tipo da listagem
            const saleWithRelations = sale as SaleItem & {
              nfe_cabecalho?: Array<{ STATUS_NOTA?: string | null }>;
              cliente?: { pessoa?: { NOME?: string | null } };
            };
            const statusInfo = getNfceStatusInfo({
              devolucao: sale.DEVOLUCAO,
              canceladoIdUsuario: sale.CANCELADO_ID_USUARIO,
              nfeStatus:
                saleWithRelations.nfe_cabecalho?.[0]?.STATUS_NOTA ?? null,
            });

            return [
              "",
              sale.ID_EMPRESA,
              sale.ID,
              sale.conta_caixa?.NOME,
              saleWithRelations.cliente?.pessoa?.NOME,
              <Badge
                className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
                key={sale.ID}
                variant={statusInfo.variant}
              >
                {statusInfo.label}
              </Badge>,
              `${sale.DATA_VENDA &&
              new Date(sale.DATA_VENDA).toLocaleDateString("pt-BR", {
                timeZone: "UTC",
              })
              } ${sale.HORA_SAIDA}`,
              formatAsCurrency(Number(sale.VALOR_TOTAL)),
              (sale.NUMERO_NFE && removeLeadingZero(String(sale.NUMERO_NFE))) ||
              "—",
              sale.SERIE_NFE || "—",
            ];
          }}
        />
      )}

      {/* Modal de detalhes da venda */}
      {isMounted && selectedSaleId && (
        <DetailSales
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedSaleId(null);
            }
          }}
          open={isModalOpen}
          saleId={selectedSaleId}
        />
      )}
    </PageLayout>
  );
}
