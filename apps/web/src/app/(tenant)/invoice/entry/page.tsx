"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Building2Icon, FileCheckIcon } from "lucide-react";
import type { Route } from "next";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import type { DateRange } from "@/components/ui/date-picker";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDate } from "@/lib/format-date";
import { formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { DetailEntry } from "./_components/DetailEntry";
import { EntryGrid } from "./_components/EntryGrid";

type EntryItem =
  RouterOutputs["tenant"]["invoiceEntry"]["all"]["invoiceEntry"][number];

/** Vários IDs na URL vêm como "79,388" (nuqs). */
function supplierFromQuery(s: string | null) {
  if (!s || s === "0") {
    return null;
  }
  const ids = s
    .split(",")
    .map((p) => Number(p.trim()))
    .filter((n) => n > 0);
  return ids.length === 0 ? null : ids.length === 1 ? ids[0] : ids;
}

export default function InvoiceEntryList() {
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const isMobile = useIsMobile();
  const [supplier, setSupplier] = useQueryState("supplier", {
    defaultValue: "0",
  });
  const [dateFrom, setDateFrom] = useQueryState("dateFrom", parseAsIsoDate);
  const [dateTo, setDateTo] = useQueryState("dateTo", parseAsIsoDate);
  const date: DateRange | undefined =
    dateFrom != null ? { from: dateFrom, to: dateTo ?? undefined } : undefined;
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const enabled = !!tenant;

  const invoiceEntryQuery = useInfiniteQuery({
    ...trpc.tenant.invoiceEntry.all.infiniteQueryOptions(
      {
        limit: 20,
        company: selectedCompanyId !== 0 ? selectedCompanyId : null,
        supplier: supplierFromQuery(supplier),
        date: date?.from ? { from: date.from, to: date.to ?? undefined } : null,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        initialCursor: null,
      }
    ),
    enabled,
  });

  const supplierQuery = useQuery({
    ...trpc.tenant.supplier.all.queryOptions(),
    enabled,
  });

  const supplierList = (supplierQuery.data?.supplier ??
    []) as unknown as Array<{
    ID: number;
    NOME: string | null;
  }>;
  const supplierOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "0", label: "TODOS" },
      ...supplierList.map((item) => ({
        value: String(item.ID),
        label: item.NOME ?? "",
      })),
    ],
    [supplierList]
  );

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
            className="flex-1 md:w-72"
            icon={<Building2Icon />}
            onValueChange={(v) => void setSupplier(v)}
            options={supplierOptions}
            placeholder="Fornecedor"
            searchPlaceholder="Buscar fornecedor..."
            value={supplier}
          />
          {/* <DatePicker
            calendarCaptionLayout="dropdown"
            calendarDisabled={{ after: new Date() }}
            className="flex-1 md:w-64"
            mode="range"
            onChange={(range) => {
              void setDateFrom(range?.from ?? null);
              void setDateTo(range?.to ?? null);
            }}
            placeholder="Data de entrada"
            value={date}
          /> */}
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
            if (!entry) {
              return null;
            }
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
