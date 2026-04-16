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
import { getSaleStatusInfo } from "@/lib/status-info";
import { cn } from "@/lib/utils";
import { type RouterOutputs, trpc } from "@/utils/trpc";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  CircleEllipsisIcon,
  CircleHelpIcon,
  FilterIcon,
  FilterXIcon,
  SquarePercentIcon,
  XIcon,
} from "lucide-react";
import type { Route } from "next";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { DetailSale } from "./_components/DetailSale";
import { SaleGrid } from "./_components/SaleGrid";

type ProductsSaleItem =
  RouterOutputs["tenant"]["productsSale"]["all"]["productsSale"][number];

const statusOptions: ComboboxOption[] = [
  { value: "T", label: "TODOS" },
  { value: "E", label: "EXECUÇÃO" },
  { value: "C", label: "CONCLUÍDO" },
];

const inactiveOptions: ComboboxOption[] = [
  { value: "T", label: "TODOS" },
  { value: "S", label: "SIM" },
  { value: "N", label: "NÃO" },
];

export default function productsSale() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const isMobile = useIsMobile();
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [status, setStatus] = useQueryState("status", { defaultValue: "T" });
  const [inactive, setInactive] = useQueryState("inactive", {
    defaultValue: "N",
  });
  const [selectedSale, setSelectedSale] = useState<ProductsSaleItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const enabled = !!tenant;

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const productsSaleQuery = useInfiniteQuery({
    ...trpc.tenant.productsSale.all.infiniteQueryOptions(
      {
        limit: 20,
        searchTerm: debouncedSearch || null,
        company: selectedCompanyId !== 0 ? selectedCompanyId : null,
        status: status !== "T" ? status : null,
        inactive: inactive !== "T" ? inactive : null,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialCursor: null,
      }
    ),
    enabled,
  });

  const statusLabel = statusOptions.find(
    (option) => option.value === status
  )?.label;
  const inactiveLabel = inactiveOptions.find(
    (option) => option.value === inactive
  )?.label;
  const hasActiveFilters =
    search.trim().length > 0 || status !== "T" || inactive !== "N";

  const clearAllFilters = () => {
    void setSearch("");
    void setStatus("T");
    void setInactive("N");
  };

  const filtersContent = (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Combobox
          className="w-full"
          icon={<CircleEllipsisIcon />}
          onValueChange={(v) => void setStatus(v)}
          options={statusOptions}
          placeholder="Status"
          searchPlaceholder="Buscar status..."
          value={status}
        />
        <Combobox
          className="w-full"
          icon={<CircleHelpIcon />}
          onValueChange={(v) => void setInactive(v)}
          options={inactiveOptions}
          placeholder="Inativo"
          searchPlaceholder="Buscar inativo..."
          value={inactive}
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
        { label: "Produtos", href: "/products" as Route },
        { label: "Promoções", isCurrent: true },
      ]}
      subtitle="Consulte campanhas promocionais e ofertas"
      title="Promoções"
    >
      <div className="flex gap-2">
        <SearchInput
          className="w-full md:w-96"
          enableF9Shortcut
          onChange={(v: string) => void setSearch(v)}
          placeholder="Pesquisar por nome da promoção"
          value={search}
        />
        <FiltersPanel
          onOpenChange={setFiltersOpen}
          open={filtersOpen}
          title="Filtros de promoções"
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
          {status !== "T" && (
            <Badge className="gap-1 pr-1" variant="secondary">
              Status: {statusLabel}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => void setStatus("T")}
                type="button"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {inactive !== "N" && (
            <Badge className="gap-1 pr-1" variant="secondary">
              Inativo: {inactiveLabel}
              <button
                className="ml-1 cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => void setInactive("N")}
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
        <SaleGrid
          data={productsSaleQuery.data?.pages}
          emptyIcon={<SquarePercentIcon className="mb-4 size-12" />}
          emptyMessage="Não foram encontradas promoções."
          fetchNextPage={productsSaleQuery.fetchNextPage}
          hasNextPage={productsSaleQuery.hasNextPage}
          isFetchingNextPage={productsSaleQuery.isFetchingNextPage}
          isLoading={productsSaleQuery.isLoading}
          loadingMessage="Carregando promoções..."
          loadMoreMessage="Carregar mais promoções"
          noMoreDataMessage="Não há mais promoções para carregar"
          onSaleClick={(sale: ProductsSaleItem) => {
            setSelectedSale(sale);
            setIsModalOpen(true);
          }}
          pageItemKeys={["productsSale"]}
        />
      ) : (
        <DataTableInfinite<ProductsSaleItem>
          data={productsSaleQuery.data?.pages}
          emptyIcon={<SquarePercentIcon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontrados Promoções."
          fetchNextPage={productsSaleQuery.fetchNextPage}
          getRowKey={(sale) => sale.ID}
          hasNextPage={productsSaleQuery.hasNextPage}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            {
              key: "empresa",
              label: "Emp.",
              className: "hidden sm:table-cell",
            },
            { key: "nome", label: "Nome", className: "" },
            { key: "status", label: "Status", className: "" },
            { key: "inicio", label: "Data inicio", className: "text-left" },
            { key: "fim", label: "Data fim", className: "text-left" },
            { key: "cadastro", label: "Data cadastro", className: "text-left" },
            {
              key: "observacao",
              label: "Observação",
              className: "hidden sm:table-cell",
            },
          ]}
          isFetchingNextPage={productsSaleQuery.isFetchingNextPage}
          // getRowClassName={(sale: any) => {
          //   return sale.STATUS === "E" ? "text-primary/70" : ""
          // }}
          isLoading={productsSaleQuery.isLoading}
          loadingMessage="Carregando mais produtos..."
          loadMoreMessage="Carregar mais produtos"
          noMoreDataMessage="Não há mais produtos para carregar"
          onRowClick={(sale) => {
            setSelectedSale(sale);
            setIsModalOpen(true);
          }}
          pageItemKeys={["productsSale"]}
          renderRow={(sale: ProductsSaleItem) => {
            // Verificar se a promoção existe
            if (!sale) {
              return null;
            }

            // Status da promoção
            const statusInfo = getSaleStatusInfo(sale.STATUS);

            return [
              "",
              sale.ID_EMPRESA,
              sale.NOME_REAJUSTE,
              <Badge
                className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
                key={`status-${sale.ID_EMPRESA}-${sale.ID_REAJUSTE ?? ""}`}
                variant={statusInfo.variant}
              >
                {statusInfo.label}
              </Badge>,
              `${sale.DATA_INICIO && formatDate(sale.DATA_INICIO)} ${sale.HORA_INICIO}`,
              `${sale.DATA_FIM && formatDate(sale.DATA_FIM)} ${sale.HORA_FIM}`,
              sale.DATA_CADASTRO && formatDate(sale.DATA_CADASTRO),
              sale.OBSERVACAO,
            ];
          }}
        />
      )}

      {/* Modal de detalhes da promoção */}
      {selectedSale && (
        <DetailSale
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setSelectedSale(null);
            }
          }}
          open={isModalOpen}
          saleData={selectedSale}
        />
      )}
    </PageLayout>
  );
}
