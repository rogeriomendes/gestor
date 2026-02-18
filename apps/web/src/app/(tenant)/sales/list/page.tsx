"use client";

import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { SearchInput } from "@/components/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { getNfceStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency, removeLeadingZero } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  ShoppingCartIcon,
  SquareUserIcon,
  XIcon,
} from "lucide-react";
import type { Route } from "next";
import { useState } from "react";
import { DetailSales } from "./_components/DetailSales";
import { SalesGrid } from "./_components/SalesGrid";

type SaleItem = RouterOutputs["tenant"]["sales"]["all"]["sales"][number];

export default function SalesList() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState<string>("0");
  const [date, setDate] = useState<Date>();
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Lazy initial state — evita flash de conteúdo vazio sem useEffect
  const [isMounted] = useState(true);

  const enabled = !!tenant;

  const dateFormatted =
    date instanceof Date
      ? new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      )
      : undefined;

  const salesQuery = useInfiniteQuery({
    ...trpc.tenant.sales.all.infiniteQueryOptions({
      limit: 20,
      searchTerm: search,
      date: dateFormatted ?? undefined,
      account: account !== "0" ? Number(account) : undefined,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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
      <div className="flex flex-col md:flex-row md:items-center">
        <SearchInput
          enableF9Shortcut
          onChange={(v: string) => setSearch(v)}
          placeholder="Pesquisa por ID e Número NFCe"
          value={search}
        />
        <div className="mt-2 flex flex-row gap-2 md:mt-0 md:ml-3 md:gap-3">
          <Combobox
            className="flex-1 md:w-48"
            icon={<SquareUserIcon />}
            onValueChange={setAccount}
            options={accountsOptions}
            placeholder="Conta caixa"
            searchPlaceholder="Buscar conta caixa..."
            value={account}
          />
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  className={cn(
                    "w-60 flex-1 justify-between px-3 text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  variant="outline"
                />
              }
            >
              <div className="flex flex-row items-center">
                <CalendarIcon className="mr-2 size-4" />
                {date ? formatDate(date, true) : <span>Data</span>}
              </div>
              <div
                className={cn(
                  "invisible size-5 cursor-pointer rounded-sm hover:bg-muted-foreground",
                  date && "visible"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  setDate(undefined);
                }}
              >
                <XIcon className="size-5" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                captionLayout="dropdown"
                disabled={{ after: new Date() }}
                locale={ptBR}
                mode="single"
                onSelect={(selectedDate) => setDate(selectedDate ?? undefined)}
                selected={date}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
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
              sale.NUMERO_NFE && removeLeadingZero(String(sale.NUMERO_NFE)),
              sale.SERIE_NFE,
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
