"use client";

import { DetailSales } from "@/app/(tenant)/sales/list/_components/DetailSales";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { getReceiveStatusById } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  HandshakeIcon,
  ShoppingCartIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useInView } from "react-intersection-observer";
import { ReceiveFilters } from "./ReceiveFilters";
import { ReceiveGrid } from "./ReceiveGrid";
import { ReceiveInfoModal } from "./ReceiveInfoModal";

type ReceiveItem =
  RouterOutputs["tenant"]["financialBillsReceive"]["all"]["receive"][number];

export default function ReceiveSalesList() {
  const isMobile = useIsMobile();
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const { inView } = useInView();
  const searchParams = useSearchParams();
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [selectedReceive, setSelectedReceive] = useState<ReceiveItem | null>(
    null
  );

  const [status, setStatus] = useState<string>("1");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const clientId = searchParams.get("clientId");

  const billsReceiveAmountQuery = useQuery({
    ...trpc.tenant.financialBillsReceive.amount.queryOptions({
      clientId: clientId ? Number(clientId) : undefined,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    enabled: !!tenant,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const billsReceiveAmountLoweredQuery = useQuery({
    ...trpc.tenant.financialBillsReceive.amountLowered.queryOptions({
      clientId: clientId ? Number(clientId) : undefined,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    enabled: !!tenant,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const billsReceiveQuery = useInfiniteQuery({
    ...trpc.tenant.financialBillsReceive.all.infiniteQueryOptions({
      limit: 30,
      clientId: clientId ? Number(clientId) : undefined,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
      status: status ? Number(status) : undefined,
      dateFrom: dateRange?.from,
      dateTo: dateRange?.to,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!tenant,
  });

  const clientQuery = useQuery({
    ...trpc.tenant.client.byId.queryOptions({
      id: clientId ? Number(clientId) : undefined,
    }),
    enabled: !!tenant && Boolean(clientId),
  });

  useEffect(() => {
    const fetchNextPageAndHandlePromise = async () => {
      try {
        await billsReceiveQuery.fetchNextPage();
      } catch (error) {
        console.error("Error fetching next page:", error);
      }
    };
    if (inView) {
      void fetchNextPageAndHandlePromise();
    }
  }, [billsReceiveQuery, billsReceiveQuery.fetchNextPage, inView]);

  const handleRowClick = (receive: ReceiveItem) => {
    if (receive?.fin_lancamento_receber?.venda_cabecalho?.ID) {
      setSelectedSaleId(receive.fin_lancamento_receber.venda_cabecalho.ID);
      setIsDetailModalOpen(true);
    } else {
      setSelectedReceive(receive);
      setIsInfoDialogOpen(true);
    }
  };

  const handleClearFilters = () => {
    setStatus("1");
    setDateRange(undefined);
  };

  return (
    <>
      <div className="mb-2 grid grid-cols-2 gap-2 md:mb-4 md:gap-4">
        <MetricCard
          icon={clientId ? UserIcon : UsersIcon}
          isLoading={billsReceiveAmountQuery.isLoading}
          subtitle={clientId ? "Total devedor" : "Total devedor dos clientes"}
          title={
            clientId ? clientQuery.data?.client?.pessoa.NOME : "Total a Receber"
          }
          useShowText={!clientId}
          value={Number(billsReceiveAmountQuery.data?.totalAmount)}
        />
        <MetricCard
          icon={HandshakeIcon}
          isLoading={billsReceiveAmountLoweredQuery.isLoading}
          subtitle={(() => {
            const data = billsReceiveAmountLoweredQuery.data as
              | {
                amountLowered?: Array<{
                  DATA_RECEBIMENTO?: string;
                  HORA_RECEBIMENTO?: string;
                  NOME_COLABORADOR?: string;
                }>;
              }
              | undefined;
            return data?.amountLowered ? (
              <span className="flex flex-row text-muted-foreground text-xs">
                {data.amountLowered[0]?.DATA_RECEBIMENTO &&
                  new Date(
                    data.amountLowered[0]?.DATA_RECEBIMENTO ?? ""
                  ).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}{" "}
                {data.amountLowered[0]?.HORA_RECEBIMENTO} -{" "}
                {data.amountLowered[0]?.NOME_COLABORADOR}
              </span>
            ) : clientId ? (
              "Não foram feitas baixas para esse cliente"
            ) : (
              "Selecione um cliente"
            );
          })()}
          title="Ultima baixa"
          useShowText={!clientId}
          value={(() => {
            const d = billsReceiveAmountLoweredQuery.data as
              | { amountLowered?: Array<{ VALOR_RECEBIDO?: number }> }
              | undefined;
            return d?.amountLowered?.length
              ? Number(d.amountLowered[0]?.VALOR_RECEBIDO ?? 0)
              : 0;
          })()}
        />
      </div>

      {/* Filtros */}
      <div className="mb-2 md:mb-4">
        <ReceiveFilters
          dateRange={dateRange}
          onClearFilters={handleClearFilters}
          onDateRangeChange={setDateRange}
          onStatusChange={setStatus}
          status={status}
        />
      </div>

      {isMobile ? (
        <ReceiveGrid
          data={billsReceiveQuery.data?.pages}
          emptyIcon={<ShoppingCartIcon className="mb-4 size-12" />}
          emptyMessage="Não foram encontrados vendas em aberto."
          fetchNextPage={billsReceiveQuery.fetchNextPage}
          hasNextPage={billsReceiveQuery.hasNextPage}
          isFetchingNextPage={billsReceiveQuery.isFetchingNextPage}
          isLoading={billsReceiveQuery.isLoading}
          loadingMessage="Carregando vendas..."
          loadMoreMessage="Carregar mais vendas"
          noMoreDataMessage="Não há mais vendas para carregar"
          onReceiveClick={handleRowClick}
          pageItemKeys={["receive"]}
        />
      ) : (
        <DataTableInfinite<ReceiveItem>
          data={billsReceiveQuery.data?.pages}
          emptyIcon={<ShoppingCartIcon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontrados vendas em aberto."
          fetchNextPage={billsReceiveQuery.fetchNextPage}
          getRowKey={(receive: ReceiveItem) => receive.ID}
          hasNextPage={billsReceiveQuery.hasNextPage}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            { key: "data", label: "Data", className: "" },
            { key: "cliente", label: "Cliente", className: "" },
            { key: "status", label: "Status", className: "" },
            { key: "valor", label: "Vlr. / Receber", className: "" },
            { key: "conta", label: "Conta Caixa", className: "" },
          ]}
          isFetchingNextPage={billsReceiveQuery.isFetchingNextPage}
          isLoading={billsReceiveQuery.isLoading}
          loadingMessage="Carregando mais vendas..."
          loadMoreMessage="Carregar mais vendas"
          noMoreDataMessage="Não há mais vendas para carregar"
          onRowClick={handleRowClick}
          pageItemKeys={["receive"]}
          renderRow={(receive: ReceiveItem) => {
            if (!receive) {
              return null;
            }

            const statusInfo = getReceiveStatusById(
              receive.ID_FIN_STATUS_PARCELA
            );

            const valorAReceber =
              receive.fin_lancamento_receber.VALOR_A_RECEBER;
            const valorRestante = receive.fin_lancamento_receber.VALOR_RESTANTE;

            let valorCell: React.ReactNode = formatAsCurrency(
              Number(valorAReceber)
            );
            if (receive.ID_FIN_STATUS_PARCELA === 2) {
              valorCell = (
                <span className="line-through">
                  {formatAsCurrency(valorAReceber)}
                </span>
              );
            } else if (receive.ID_FIN_STATUS_PARCELA === 3) {
              valorCell = (
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs line-through">
                    {formatAsCurrency(valorAReceber)}
                  </span>
                  <span className="font-medium">
                    {formatAsCurrency(valorRestante)}
                  </span>
                </div>
              );
            }

            return [
              "",
              `${receive.fin_lancamento_receber.DATA_LANCAMENTO &&
              formatDate(receive.fin_lancamento_receber.DATA_LANCAMENTO)
              } ${receive.fin_lancamento_receber.venda_cabecalho?.HORA_SAIDA ?? ""}`,
              receive.fin_lancamento_receber?.venda_cabecalho?.cliente?.pessoa
                ?.NOME ??
              receive.fin_lancamento_receber?.cliente?.pessoa?.NOME ??
              "—",
              <Badge
                className={cn("px-1.5 py-0.5 text-xs", statusInfo.color)}
                key="status"
                variant={statusInfo.variant}
              >
                {statusInfo.label}
              </Badge>,
              valorCell,
              receive?.fin_lancamento_receber?.venda_cabecalho?.conta_caixa
                ?.NOME ?? "—",
            ];
          }}
        />
      )}
      <DetailSales
        onOpenChange={setIsDetailModalOpen}
        open={isDetailModalOpen}
        saleId={selectedSaleId}
      />

      <ReceiveInfoModal
        onOpenChange={setIsInfoDialogOpen}
        open={isInfoDialogOpen}
        receive={selectedReceive}
      />
    </>
  );
}
