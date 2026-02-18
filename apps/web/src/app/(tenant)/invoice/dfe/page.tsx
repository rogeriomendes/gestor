"use client";

import { PageLayout } from "@/components/layouts/page-layout";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { decodeDocXml } from "@/lib/decode-doc-xml";
import { formatDate } from "@/lib/format-date";
import { getXmlStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Building2Icon, EyeOffIcon } from "lucide-react";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { DetailDfe } from "./_components/DetailDfe";
import { DfeGrid } from "./_components/DfeGrid";
import { HideDfeDialog } from "./_components/HideDfeButton";

type DfeItem =
  RouterOutputs["tenant"]["invoiceDfe"]["all"]["invoiceDfe"][number];

export default function InvoiceDfeList() {
  const isMobile = useIsMobile();
  const { tenant } = useTenant();
  const { selectedCompany } = useCompany();
  const [supplier, setSupplier] = useState<string>("0");
  const [selectedDfeId, setSelectedDfeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHideModalOpen, setIsHideModalOpen] = useState(false);
  const [selectedDfeForHide, setSelectedDfeForHide] = useState<DfeItem | null>(
    null
  );

  const companyQuery = useQuery({
    ...trpc.tenant.companies.all.queryOptions(),
    enabled: !!tenant,
  });

  const invoiceDfeQuery = useQuery({
    ...trpc.tenant.invoiceDfe.all.queryOptions({
      company: selectedCompany?.CNPJ || undefined,
      supplier: supplier !== "0" ? supplier : undefined,
    }),
    enabled: !!tenant,
  });

  const supplierQuery = useQuery({
    ...trpc.tenant.supplier.all.queryOptions(),
    enabled: !!tenant,
  });

  const supplierList = (supplierQuery.data?.supplier ?? []) as Array<{
    NOME: string | null;
  }>;
  const supplierOptions: ComboboxOption[] = useMemo(
    () => [
      { value: "0", label: "TODOS" },
      ...supplierList.map((item) => ({
        value: item.NOME ?? "",
        label: item.NOME ?? "",
      })),
    ],
    [supplierList]
  );

  const handleRowClick = (dfe: DfeItem) => {
    setSelectedDfeId(dfe.CHAVE_ACESSO);
    setIsModalOpen(true);
  };

  const handleHideDfe = (dfe: DfeItem) => {
    setSelectedDfeForHide(dfe);
    setIsHideModalOpen(true);
  };

  // Função para buscar o ID da empresa pelo CNPJ
  const getCompanyIdByCnpj = (cnpj: string) => {
    const company = companyQuery.data?.company?.find(
      (comp) => comp.CNPJ === cnpj
    );
    return company?.ID || null;
  };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" as Route },
        { label: "Estoque", href: "/invoice" as Route },
        { label: "Consultar Notas", isCurrent: true },
      ]}
      subtitle="Consulte notas fiscais emitidas contra sua empresa"
      title="Consultar Notas"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex flex-row gap-2 md:gap-3">
          <Combobox
            className="flex-1 md:w-64"
            icon={<Building2Icon />}
            onValueChange={setSupplier}
            options={supplierOptions}
            placeholder="Fornecedor"
            searchPlaceholder="Buscar fornecedor..."
            value={supplier}
          />
        </div>
      </div>
      {isMobile ? (
        <DfeGrid
          data={[{ invoiceDfe: invoiceDfeQuery.data?.invoiceDfe || [] }]}
          emptyIcon={<Building2Icon className="mb-4 size-12" />}
          emptyMessage="Não foram encontradas notas fiscais."
          fetchNextPage={async () => { }}
          hasNextPage={false}
          isFetchingNextPage={false}
          isLoading={invoiceDfeQuery.isLoading}
          loadingMessage="Carregando notas fiscais..."
          loadMoreMessage="Carregar mais notas fiscais"
          noMoreDataMessage="Não há mais notas fiscais para carregar"
          onDfeClick={handleRowClick}
          onDfeHide={handleHideDfe}
          pageItemKeys={["invoiceDfe"]}
        />
      ) : (
        <DataTableInfinite<DfeItem>
          data={[{ invoiceDfe: invoiceDfeQuery.data?.invoiceDfe || [] }]}
          emptyIcon={<Building2Icon className="mr-5 size-10 md:size-14" />}
          emptyMessage="Não foram encontradas notas fiscais."
          fetchNextPage={async () => { }}
          getRowKey={(dfe: DfeItem) => dfe.CHAVE_ACESSO}
          hasNextPage={false}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            {
              key: "empresa",
              label: "Emp.",
              className: "",
            },
            { key: "fornecedor", label: "Fornecedor", className: "" },
            { key: "xmlStatus", label: "Status XML", className: "text-center" },
            { key: "valor", label: "Vlr. Total", className: "" },
            { key: "emissao", label: "Emissão", className: "" },
            { key: "nfe", label: "NFe", className: "" },
            { key: "hide", label: "Ocultar", className: "text-center" },
          ]}
          isFetchingNextPage={false}
          isLoading={invoiceDfeQuery.isLoading}
          loadingMessage="Carregando notas fiscais..."
          loadMoreMessage="Carregar mais notas fiscais"
          noMoreDataMessage="Não há mais notas fiscais para carregar"
          onRowClick={handleRowClick}
          pageItemKeys={["invoiceDfe"]}
          renderRow={(dfe: DfeItem) => {
            if (!dfe) {
              return null;
            }

            const statusInfo = getXmlStatusInfo(
              dfe.DOCXML && decodeDocXml(dfe.DOCXML)
            );

            return [
              "",
              getCompanyIdByCnpj(dfe.CNPJ_EMPRESA || "") || dfe.CNPJ_EMPRESA,
              <span className="uppercase" key="fornecedor">
                {dfe.RAZAO_SOCIAL}
              </span>,
              <Badge
                className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
                key="status"
                variant={statusInfo.variant}
              >
                {statusInfo.label}
              </Badge>,
              formatAsCurrency(Number(dfe.VALOR)),
              formatDate(dfe.EMISSAO),
              dfe.NUMERO,
              <Button
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                key="hide"
                onClick={(e) => {
                  e.stopPropagation();
                  handleHideDfe(dfe);
                }}
                size="sm"
                variant="ghost"
              >
                <EyeOffIcon className="h-3 w-3" />
              </Button>,
            ];
          }}
        />
      )}

      {selectedDfeId && (
        <DetailDfe
          entryID={selectedDfeId}
          onOpenChange={setIsModalOpen}
          open={isModalOpen}
        />
      )}

      {selectedDfeForHide && (
        <HideDfeDialog
          dfe={selectedDfeForHide}
          onOpenChange={setIsHideModalOpen}
          onSuccess={() => {
            invoiceDfeQuery.refetch();
            setSelectedDfeForHide(null);
          }}
          open={isHideModalOpen}
        />
      )}
    </PageLayout>
  );
}
