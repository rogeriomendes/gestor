"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ptBR } from "date-fns/locale";
import {
  Building2Icon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  CoinsIcon,
  PackageIcon,
  Settings2Icon,
  SquareCheckIcon,
} from "lucide-react";
import type { Route } from "next";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useInView } from "react-intersection-observer";
import { DetailEntry } from "@/app/(tenant)/invoice/entry/_components/DetailEntry";
import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import { getPayStatusBySituation, getPayStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { DetailPay } from "./_components/DetailPay";
import { PayGrid } from "./_components/PayGrid";

type BillsPayItem =
  RouterOutputs["tenant"]["financialBillsPay"]["all"]["financialBills"][number];

export default function FinancialBillsPayList() {
  const isMobile = useIsMobile();
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const { inView } = useInView({ rootMargin: "30%" });
  const [selectedBills, setSelectedBills] = useState<
    Record<string, number | boolean>
  >({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [totalValue, setTotalValue] = useState(0);
  const [selectedBillsCount, setSelectedBillsCount] = useState(0);
  const [selectAll, setSelectAll] = useState(false);
  const [supplier, setSupplier] = useState<string>("0");
  const [situation, setSituation] = useState<string>("open");
  const [date, setDate] = useState<DateRange | undefined>();
  const [selectedBillsPay, setSelectedBillsPay] = useState<BillsPayItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const financialBillsPayQuery = useInfiniteQuery({
    ...trpc.tenant.financialBillsPay.all.infiniteQueryOptions({
      limit: 20,
      filter: situation,
      company: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
      supplier: supplier !== "0" ? Number(supplier) : null,
      date: date
        ? {
            from: date.from ?? new Date(),
            to: date.to ?? null,
          }
        : null,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!tenant,
  });

  const supplierQuery = useQuery({
    ...trpc.tenant.supplier.all.queryOptions(),
    enabled: !!tenant,
  });

  const totalBillsPayAmount = useQuery({
    ...trpc.tenant.financialBillsPay.amount.queryOptions({
      company: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
      filter: "all",
    }),
    enabled: !!tenant,
  });

  const totalBillsPayAmountWeek = useQuery({
    ...trpc.tenant.financialBillsPay.amount.queryOptions({
      company: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
      filter: "week",
    }),
    enabled: !!tenant,
  });

  const totalBillsPayAmountRange = useQuery({
    ...trpc.tenant.financialBillsPay.amount.queryOptions({
      company: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
      supplier: supplier !== "0" ? Number(supplier) : null,
      date: date
        ? {
            from: date.from ?? new Date(),
            to: date.to ?? null,
          }
        : null,
    }),
    enabled: !!tenant,
  });

  const supplierList = (supplierQuery.data?.supplier ?? []) as Array<{
    ID: number;
    NOME: string | null;
  }>;
  const supplierOptions: ComboboxOption[] = [
    { value: "0", label: "TODOS" },
    ...supplierList.map((item) => ({
      value: String(item.ID),
      label: item.NOME ?? "",
    })),
  ];

  const situationOptions: ComboboxOption[] = [
    { value: "all", label: "TODOS" },
    { value: "open", label: "ABERTO" },
    { value: "paid", label: "QUITADO" },
  ];

  useEffect(() => {
    const fetchNextPageAndHandlePromise = async () => {
      try {
        await financialBillsPayQuery.fetchNextPage();
      } catch (error) {
        console.error("Error fetching next page:", error);
      }
    };
    if (inView) {
      void fetchNextPageAndHandlePromise();
    }
  }, [financialBillsPayQuery, financialBillsPayQuery.fetchNextPage, inView]);

  const handleRowClick = (bills: BillsPayItem) => {
    setSelectedBillsPay(bills);
    setIsModalOpen(true);
  };

  const resetSelection = () => {
    setSelectedBills({});
    setSelectedRows(new Set());
    setTotalValue(0);
    setSelectedBillsCount(0);
    setSelectAll(false);
  };

  const handleCheckboxChange = (
    billId: number,
    billValue: number,
    checked: boolean
  ) => {
    setSelectedBills((prev) => ({
      ...prev,
      [billId]: checked ? billValue : false,
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // Selecionar todos os itens visíveis
      const allItems: BillsPayItem[] =
        financialBillsPayQuery.data?.pages?.flatMap((page) => {
          const pageData = page as { financialBills?: BillsPayItem[] };
          return pageData?.financialBills ?? [];
        }) ?? [];

      const newSelectedBills: Record<string, number | boolean> = {};
      const newSelectedRows = new Set<number>();
      allItems.forEach((bill: BillsPayItem, index: number) => {
        if (bill) {
          newSelectedBills[bill.ID] = Number(bill.VALOR);
          newSelectedRows.add(index);
        }
      });
      setSelectedBills(newSelectedBills);
      setSelectedRows(newSelectedRows);
    } else {
      // Deselecionar todos
      setSelectedBills({});
      setSelectedRows(new Set());
    }
  };

  // Resetar seleção quando a empresa mudar
  useEffect(() => {
    resetSelection();
  }, [selectedCompanyId]);

  useEffect(() => {
    const total = Object.values(selectedBills).reduce<number>((sum, value) => {
      if (typeof value === "number") {
        return sum + value;
      }
      return sum;
    }, 0);
    setTotalValue(total);
    setSelectedBillsCount(
      Object.keys(selectedBills).filter((key) => selectedBills[key] !== false)
        .length
    );

    // Atualizar estado selectAll baseado na seleção atual
    const allItems: BillsPayItem[] =
      financialBillsPayQuery.data?.pages?.flatMap((page) => {
        const pageData = page as { financialBills?: BillsPayItem[] };
        return pageData?.financialBills ?? [];
      }) ?? [];

    const totalItems = allItems.filter(
      (bill): bill is BillsPayItem => !!bill
    ).length;
    const selectedCount = Object.keys(selectedBills).filter(
      (key) => selectedBills[key] !== false
    ).length;

    setSelectAll(totalItems > 0 && selectedCount === totalItems);

    // Sincronizar selectedRows com selectedBills
    const newSelectedRows = new Set<number>();
    allItems.forEach((bill: BillsPayItem, index: number) => {
      if (bill && selectedBills[bill.ID]) {
        newSelectedRows.add(index);
      }
    });
    setSelectedRows(newSelectedRows);
  }, [selectedBills, financialBillsPayQuery.data]);

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" as Route },
        { label: "Financeiro", href: "/financial" as Route },
        { label: "Contas a Pagar", isCurrent: true },
      ]}
      subtitle="Consulte os pagamentos e contas a vencer"
      title="Contas a Pagar"
    >
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
        <MetricCard
          icon={CoinsIcon}
          isLoading={totalBillsPayAmount.isLoading}
          subtitle="Valor total em aberto"
          title="Total a Pagar"
          value={Number(totalBillsPayAmount.data?.totalAmount)}
        />
        <MetricCard
          icon={CalendarDaysIcon}
          isLoading={totalBillsPayAmountWeek.isLoading}
          subtitle="Valor total em aberto da semana"
          title="Total da semana"
          value={Number(totalBillsPayAmountWeek.data?.totalAmount)}
        />
        <MetricCard
          icon={CalendarRangeIcon}
          isLoading={date ? totalBillsPayAmountRange.isLoading : false}
          subtitle="Valor total em aberto da data selecionada"
          title="Total do período"
          useShowText={false}
          // className={!date ? "line-through" : ""}
          value={date ? totalBillsPayAmountRange.data?.totalAmount || 0 : 0}
        />
        <MetricCard
          icon={SquareCheckIcon}
          subtitle={
            totalValue !== 0
              ? `Valor total de ${selectedBillsCount} título${selectedBillsCount > 1 ? "s" : ""}`
              : "Selecione os títulos"
          }
          title="Selecionados"
          useShowText={false}
          // className={totalValue === 0 ? "line-through" : ""}
          value={totalValue}
        />
      </div>
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex flex-row gap-2 md:gap-3">
          <Combobox
            className="w-full md:w-64"
            icon={<Building2Icon className="size-4" />}
            onValueChange={(v) => {
              setSupplier(v);
              resetSelection();
            }}
            options={supplierOptions}
            placeholder="Fornecedor"
            value={supplier}
          />
        </div>
        <div className="mt-2 flex flex-row gap-2 md:mt-0 md:ml-3 md:gap-3">
          <Combobox
            icon={<Settings2Icon className="size-4" />}
            onValueChange={(v) => {
              setSituation(v);
              resetSelection();
            }}
            options={situationOptions}
            placeholder="Situação"
            value={situation}
          />
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  className={cn(
                    "w-60 justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  variant="outline"
                />
              }
            >
              <CalendarRangeIcon className="h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {formatDate(date.from, true)} - {formatDate(date.to, true)}
                  </>
                ) : (
                  formatDate(date.from, true)
                )
              ) : (
                <span>Data de vencimento</span>
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                captionLayout="dropdown"
                defaultMonth={date?.from}
                locale={ptBR}
                mode="range"
                onSelect={(date) => {
                  setDate(date);
                  resetSelection();
                }}
                selected={date}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {isMobile ? (
        <PayGrid
          data={financialBillsPayQuery.data?.pages}
          emptyIcon={<PackageIcon className="mb-4 size-12" />}
          emptyMessage="Não foram encontrados contas a pagar."
          fetchNextPage={financialBillsPayQuery.fetchNextPage}
          hasNextPage={financialBillsPayQuery.hasNextPage}
          isFetchingNextPage={financialBillsPayQuery.isFetchingNextPage}
          isLoading={financialBillsPayQuery.isLoading}
          loadingMessage="Carregando contas a pagar..."
          loadMoreMessage="Carregar mais contas a pagar"
          noMoreDataMessage="Não há mais contas a pagar para carregar"
          onBillsClick={handleRowClick}
          onBillsSelect={handleCheckboxChange}
          onSelectAll={handleSelectAll}
          pageItemKeys={["financialBills"]}
          selectAll={selectAll}
          selectedBills={selectedBills}
        />
      ) : (
        <DataTableInfinite<BillsPayItem>
          data={financialBillsPayQuery.data?.pages}
          emptyIcon={<PackageIcon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontrados contas a pagar."
          fetchNextPage={financialBillsPayQuery.fetchNextPage}
          getRowKey={(bills: BillsPayItem) => bills.ID}
          hasNextPage={financialBillsPayQuery.hasNextPage}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            {
              key: "checkbox",
              label: (
                <Checkbox
                  checked={selectAll}
                  className="h-5 w-5"
                  onCheckedChange={handleSelectAll}
                  onClick={(e) => e.stopPropagation()}
                />
              ),
              className: "",
            },
            { key: "empresa", label: "Emp.", className: "" },
            { key: "parcela", label: "Parc.", className: "" },
            { key: "nome", label: "Nome", className: "" },
            { key: "status", label: "Status", className: "" },
            { key: "valor", label: "Vlr. Total", className: "" },
            { key: "vencimento", label: "Vencimento", className: "" },
            { key: "nfe", label: "NFe", className: "" },
            { key: "historico", label: "Histórico", className: "" },
          ]}
          isFetchingNextPage={financialBillsPayQuery.isFetchingNextPage}
          isLoading={financialBillsPayQuery.isLoading}
          loadingMessage="Carregando mais contas a pagar..."
          loadMoreMessage="Carregar mais contas a pagar"
          noMoreDataMessage="Não há mais contas a pagar para carregar"
          onRowClick={handleRowClick}
          pageItemKeys={["financialBills"]}
          renderRow={(bills: BillsPayItem) => {
            if (!bills) return null;

            const statusInfo =
              bills.fin_status_parcela?.SITUACAO === "2"
                ? getPayStatusBySituation(bills.fin_status_parcela?.SITUACAO)
                : getPayStatusInfo(bills.DATA_VENCIMENTO);

            return [
              "",
              <Checkbox
                checked={!!selectedBills[bills.ID]}
                className="h-5 w-5"
                id={String(bills.ID)}
                key="cb"
                onCheckedChange={(checked: boolean) => {
                  handleCheckboxChange(bills.ID, Number(bills.VALOR), checked);
                }}
                onClick={(e) => e.stopPropagation()}
              />,
              bills.fin_lancamento_pagar.ID_EMPRESA,
              <>
                {bills.NUMERO_PARCELA}/{bills.parcelasCount}
              </>,
              <span className="uppercase" key="nome">
                {bills.fin_lancamento_pagar.fornecedor?.pessoa.NOME}
              </span>,
              <Badge
                className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
                key="status"
                variant={statusInfo.variant}
              >
                {statusInfo.label}
              </Badge>,
              formatAsCurrency(Number(bills.VALOR)),
              bills.DATA_VENCIMENTO ? formatDate(bills.DATA_VENCIMENTO) : "—",
              bills.fin_lancamento_pagar.nfe_cabecalho?.NUMERO ?? "—",
              <div
                className="max-w-72 truncate"
                key="hist"
                title={bills.fin_lancamento_pagar.HISTORICO ?? undefined}
              >
                {bills.fin_lancamento_pagar.HISTORICO ?? "—"}
              </div>,
            ];
          }}
          selectedRows={selectedRows}
        />
      )}

      {selectedBillsPay &&
        (selectedBillsPay.fin_lancamento_pagar?.ID_NFE_CABECALHO ? (
          <DetailEntry
            billsPayID={selectedBillsPay.ID}
            entryID={selectedBillsPay.fin_lancamento_pagar.ID_NFE_CABECALHO}
            onOpenChange={setIsModalOpen}
            open={isModalOpen}
          />
        ) : (
          <DetailPay
            billsPay={selectedBillsPay}
            onOpenChange={setIsModalOpen}
            open={isModalOpen}
          />
        ))}
    </PageLayout>
  );
}
