"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PackageIcon, SquareUserIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
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
import { getFinancialClosingStatusInfo } from "@/lib/status-info";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { FinancialClosingGrid } from "./_components/FinancialClosingGrid";

type AccountItem =
  RouterOutputs["tenant"]["account"]["all"]["accounts"][number];
type ClosingItem =
  RouterOutputs["tenant"]["financialClosing"]["all"]["financialClosing"][number];

type ClosingListItem =
  | { type: "open"; data: AccountItem }
  | { type: "closed"; data: ClosingItem };

function buildQueryFromItem(item: ClosingListItem): Record<string, string> {
  const { data, type } = item;
  if (type === "open") {
    const d = data as AccountItem;
    const today = new Date();
    const dateOpen =
      d.DATA_ULTIMA_ABERTURA != null && String(d.DATA_ULTIMA_ABERTURA) !== ""
        ? String(d.DATA_ULTIMA_ABERTURA)
        : today.toISOString().slice(0, 10);
    const hourOpen =
      d.HORA_ULTIMA_ABERTURA && String(d.HORA_ULTIMA_ABERTURA).trim() !== ""
        ? String(d.HORA_ULTIMA_ABERTURA)
        : "00:00:00";
    return {
      id: String(d.ID),
      name: d.NOME || "",
      dateOpen,
      hourOpen,
    };
  }
  const d = data as ClosingItem;
  return {
    id: String(d.ID_CONTA_CAIXA),
    name: d.conta_caixa?.NOME || "",
    dateOpen: d.DATA_ABERTURA ? String(d.DATA_ABERTURA) : "",
    hourOpen: d.HORA_ABERTURA || "",
    dateClosed: d.DATA_FECHAMENTO ? String(d.DATA_FECHAMENTO) : "",
    hourClosed: d.HORA_FECHAMENTO || "",
  };
}

export default function FinancialClosingsList() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const [account, setAccount] = useState<string>("0");
  const [date, setDate] = useState<Date>();

  const dateFormatted =
    date instanceof Date
      ? new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
        )
      : undefined;

  const financialClosingsQuery = useInfiniteQuery({
    ...trpc.tenant.financialClosing.all.infiniteQueryOptions({
      limit: 20,
      account: account !== "0" ? Number(account) : undefined,
      date: dateFormatted || null,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!tenant,
  });

  const accountsQuery = useQuery({
    ...trpc.tenant.account.all.queryOptions({
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    enabled: !!tenant,
  });

  const accountsOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "0", label: "TODOS" },
      ...(accountsQuery.data?.accounts?.map((item: AccountItem) => ({
        value: item.ID.toString(),
        label: item.NOME ?? "",
      })) ?? []),
    ],
    [accountsQuery.data?.accounts]
  );

  const combinedPages = useMemo(() => {
    const openAccounts: ClosingListItem[] =
      accountsQuery.data?.accounts
        ?.filter((acc: AccountItem) => acc.STATUS_CAIXA_ABERTO === "S")
        .map((acc: AccountItem) => ({ type: "open" as const, data: acc })) ??
      [];
    const firstPageClosings: ClosingListItem[] =
      financialClosingsQuery.data?.pages[0]?.financialClosing?.map(
        (closing: ClosingItem) => ({ type: "closed" as const, data: closing })
      ) ?? [];
    const firstPage = {
      combinedData: [...openAccounts, ...firstPageClosings],
    };
    const restPages =
      financialClosingsQuery.data?.pages?.slice(1)?.map((page) => ({
        combinedData: (page.financialClosing ?? []).map(
          (closing: ClosingItem) => ({
            type: "closed" as const,
            data: closing,
          })
        ),
      })) ?? [];
    return [firstPage, ...restPages];
  }, [accountsQuery.data?.accounts, financialClosingsQuery.data?.pages]);

  const goToDetail = useCallback(
    (item: ClosingListItem) => {
      const query = buildQueryFromItem(item);
      router.push(
        `/financial/closing/detail?${new URLSearchParams(query).toString()}`
      );
    },
    [router]
  );

  const renderRow = useCallback(
    (item: ClosingListItem, _index: number): React.ReactNode[] | null => {
      const { type, data } = item;
      const statusInfo = getFinancialClosingStatusInfo(type);
      if (type === "open") {
        const d = data as AccountItem;
        return [
          "",
          String(d.ID_EMPRESA),
          d.NOME ?? "",
          <Badge
            className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
            key="status"
            variant={statusInfo.variant}
          >
            {statusInfo.label}
          </Badge>,
          d.DATA_ULTIMA_ABERTURA
            ? `${formatDate(new Date(d.DATA_ULTIMA_ABERTURA))} ${d.HORA_ULTIMA_ABERTURA ?? ""}`
            : "",
          "",
        ];
      }
      const d = data as ClosingItem;
      return [
        "",
        String(d.conta_caixa.ID_EMPRESA),
        d.conta_caixa.NOME ?? "",
        <Badge
          className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
          key="status"
          variant={statusInfo.variant}
        >
          {statusInfo.label}
        </Badge>,
        d.DATA_ABERTURA
          ? `${formatDate(new Date(d.DATA_ABERTURA))} ${d.HORA_ABERTURA ?? ""}`
          : "",
        d.DATA_FECHAMENTO
          ? `${formatDate(new Date(d.DATA_FECHAMENTO))} ${d.HORA_FECHAMENTO ?? ""}`
          : "",
      ];
    },
    []
  );

  const getRowKey = useCallback((item: ClosingListItem, index: number) => {
    if (item.type === "open") {
      return `open-${item.data.ID}`;
    }
    return `closed-${item.data.ID_CONTA_CAIXA}-${index}`;
  }, []);

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" as Route },
        { label: "Financeiro", href: "/financial" as Route },
        { label: "Fechamentos", isCurrent: true },
      ]}
      subtitle="Consulte as aberturas e fechamentos de caixa"
      title="Movimento do caixa"
    >
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex flex-row gap-2 md:gap-3">
          <Combobox
            className="flex-1 md:w-48"
            icon={<SquareUserIcon className="size-4" />}
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
                    "flex-1 justify-between px-3 text-left font-normal md:w-60",
                    !date && "text-muted-foreground"
                  )}
                  variant="outline"
                />
              }
            >
              <div className="flex flex-row items-center">
                <CalendarIcon className="mr-2 size-4" />
                {date ? formatDate(date, true) : <span>Data de abertura</span>}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                captionLayout="dropdown"
                disabled={{ after: new Date() }}
                locale={ptBR}
                mode="single"
                onSelect={setDate}
                selected={date}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {isMobile ? (
        <FinancialClosingGrid
          data={combinedPages}
          emptyIcon={<PackageIcon className="mb-4 size-12" />}
          emptyMessage="Não foram encontrados caixas."
          fetchNextPage={financialClosingsQuery.fetchNextPage}
          hasNextPage={financialClosingsQuery.hasNextPage}
          isFetchingNextPage={financialClosingsQuery.isFetchingNextPage}
          isLoading={financialClosingsQuery.isLoading}
          loadingMessage="Carregando fechamentos de caixa..."
          loadMoreMessage="Carregar mais fechamentos de caixa"
          noMoreDataMessage="Não há mais fechamentos de caixa para carregar"
          onItemClick={goToDetail}
          pageItemKeys={["combinedData"]}
        />
      ) : (
        <DataTableInfinite<ClosingListItem>
          data={combinedPages}
          emptyIcon={<PackageIcon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontrados caixas."
          fetchNextPage={financialClosingsQuery.fetchNextPage}
          getRowKey={getRowKey}
          hasNextPage={financialClosingsQuery.hasNextPage}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            {
              key: "empresa",
              label: "Emp.",
              className: "hidden sm:table-cell",
            },
            { key: "conta", label: "Conta caixa", className: "" },
            { key: "status", label: "Status", className: "" },
            { key: "abertura", label: "Abertura", className: "" },
            { key: "fechamento", label: "Fechamento", className: "" },
          ]}
          isFetchingNextPage={financialClosingsQuery.isFetchingNextPage}
          isLoading={financialClosingsQuery.isLoading}
          loadingMessage="Carregando mais fechamentos de caixa..."
          loadMoreMessage="Carregar mais fechamentos de caixa"
          noMoreDataMessage="Não há mais fechamentos de caixa para carregar"
          onRowClick={goToDetail}
          pageItemKeys={["combinedData"]}
          renderRow={renderRow}
        />
      )}
    </PageLayout>
  );
}
