"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  CircleEllipsisIcon,
  CircleHelpIcon,
  SquarePercentIcon,
} from "lucide-react";
import type { Route } from "next";
import { useState } from "react";
import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { Badge } from "@/components/ui/badge";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { getSaleStatusInfo } from "@/lib/status-info";
import { cn } from "@/lib/utils";
import { type RouterOutputs, trpc } from "@/utils/trpc";
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
  const [status, setStatus] = useState<string>("T");
  const [inactive, setInactive] = useState<string>("N");
  const [selectedSale, setSelectedSale] = useState<ProductsSaleItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const enabled = !!tenant;

  const productsSaleQuery = useInfiniteQuery({
    ...trpc.tenant.productsSale.all.infiniteQueryOptions({
      limit: 20,
      company: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
      status: status !== "T" ? status : undefined,
      inactive: inactive !== "T" ? inactive : undefined,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

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
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex flex-row gap-2 md:gap-3">
          <Combobox
            className="flex-1 md:w-48"
            icon={<CircleEllipsisIcon />}
            onValueChange={setStatus}
            options={statusOptions}
            placeholder="Status"
            searchPlaceholder="Buscar status..."
            value={status}
          />
          <Combobox
            className="flex-1 md:w-48"
            icon={<CircleHelpIcon />}
            onValueChange={setInactive}
            options={inactiveOptions}
            placeholder="Inativo"
            searchPlaceholder="Buscar inativo..."
            value={inactive}
          />
        </div>
      </div>
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
