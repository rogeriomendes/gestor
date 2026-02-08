"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ptBR } from "date-fns/locale";
import { Building2Icon, CalendarRangeIcon, FileCheckIcon } from "lucide-react";
import type { Route } from "next";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
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
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { DetailEntry } from "./_components/DetailEntry";
import { EntryGrid } from "./_components/EntryGrid";

type EntryItem =
  RouterOutputs["tenant"]["invoiceEntry"]["all"]["invoiceEntry"][number];

export default function InvoiceEntryList() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const isMobile = useIsMobile();
  const [supplier, setSupplier] = useState<string>("0");
  const [date, setDate] = useState<DateRange | undefined>();
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const enabled = !!tenant;

  const invoiceEntryQuery = useInfiniteQuery({
    ...trpc.tenant.invoiceEntry.all.infiniteQueryOptions({
      limit: 20,
      company: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
      supplier: supplier !== "0" ? Number(supplier) : undefined,
      date: date
        ? {
            from: date.from ?? new Date(),
            to: date.to ?? undefined,
          }
        : undefined,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

  const supplierQuery = useQuery({
    ...trpc.tenant.supplier.all.queryOptions(),
    enabled,
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

  const handleRowClick = (entry: EntryItem) => {
    setSelectedEntryId(entry.ID);
    setIsModalOpen(true);
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" as Route },
        { label: "Estoque", href: "/invoice" as Route },
        { label: "Entrada de Nota Fiscal", isCurrent: true },
      ]}
      subtitle="Consulte as entradas de notas fiscais"
      title="Entrada de Nota Fiscal"
    >
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex flex-row gap-2 md:gap-3">
          <Combobox
            className="w-full md:w-64"
            icon={<Building2Icon />}
            onValueChange={setSupplier}
            options={supplierOptions}
            placeholder="Fornecedor"
            value={supplier}
          />
        </div>
        <div className="mt-2 flex flex-row gap-2 md:mt-0 md:ml-3 md:gap-3">
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  className={cn(
                    "w-full justify-start text-left font-normal md:w-60",
                    !date && "text-muted-foreground"
                  )}
                  id="date"
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
                <span>Data de entrada</span>
              )}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                captionLayout="dropdown"
                defaultMonth={date?.from}
                locale={ptBR}
                mode="range"
                onSelect={setDate}
                selected={date}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {isMobile ? (
        <EntryGrid
          data={invoiceEntryQuery.data?.pages}
          emptyIcon={<FileCheckIcon className="mb-4 size-12" />}
          emptyMessage="Não foram encontradas notas fiscais."
          fetchNextPage={invoiceEntryQuery.fetchNextPage}
          hasNextPage={invoiceEntryQuery.hasNextPage}
          isFetchingNextPage={invoiceEntryQuery.isFetchingNextPage}
          isLoading={invoiceEntryQuery.isLoading}
          loadingMessage="Carregando notas fiscais..."
          loadMoreMessage="Carregar mais notas fiscais"
          noMoreDataMessage="Não há mais notas fiscais para carregar"
          onEntryClick={handleRowClick}
          pageItemKeys={["invoiceEntry", "items"]}
        />
      ) : (
        <DataTableInfinite<EntryItem>
          data={invoiceEntryQuery.data?.pages}
          emptyIcon={<FileCheckIcon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontradas notas fiscais."
          fetchNextPage={invoiceEntryQuery.fetchNextPage}
          getRowKey={(entry) => entry.ID}
          hasNextPage={invoiceEntryQuery.hasNextPage}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            { key: "empresa", label: "Emp.", className: "" },
            { key: "fornecedor", label: "Fornecedor", className: "" },
            { key: "valor", label: "Vlr. Total", className: "" },
            { key: "entrada", label: "Entrada", className: "" },
            {
              key: "emissao",
              label: "Emissão",
              className: "hidden sm:table-cell",
            },
            { key: "nfe", label: "NFe", className: "hidden sm:table-cell" },
          ]}
          isFetchingNextPage={invoiceEntryQuery.isFetchingNextPage}
          isLoading={invoiceEntryQuery.isLoading}
          loadingMessage="Carregando mais notas fiscais..."
          loadMoreMessage="Carregar mais notas fiscais"
          noMoreDataMessage="Não há mais notas fiscais para carregar"
          onRowClick={handleRowClick}
          pageItemKeys={["invoiceEntry"]}
          renderRow={(entry: EntryItem) => {
            if (!entry) return null;
            return [
              "",
              entry.ID_EMPRESA,
              <span className="uppercase" key="nome">
                {entry.fornecedor?.pessoa.NOME}
              </span>,
              formatAsCurrency(Number(entry.VALOR_TOTAL)),
              `${
                entry.DATA_ENTRADA_SAIDA && formatDate(entry.DATA_ENTRADA_SAIDA)
              } ${entry.HORA_ENTRADA_SAIDA ?? ""}`,
              entry.DATA_EMISSAO ? formatDate(entry.DATA_EMISSAO) : "",
              entry.NUMERO,
            ];
          }}
        />
      )}

      {selectedEntryId && (
        <DetailEntry
          entryID={selectedEntryId}
          onOpenChange={setIsModalOpen}
          open={isModalOpen}
        />
      )}
    </PageLayout>
  );
}
