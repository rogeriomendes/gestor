import { useInfiniteQuery } from "@tanstack/react-query";
import {
  MoveDownIcon,
  MoveUpIcon,
  MoveVerticalIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { useState } from "react";
import { DetailSales } from "@/app/(tenant)/sales/list/_components/DetailSales";
import { DataTableInfinite } from "@/components/lists/data-table-infinite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/contexts/company-context";
import { useTenant } from "@/contexts/tenant-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { getNfceStatusInfo } from "@/lib/status-info";
import { cn, formatAsCurrency, removeLeadingZero } from "@/lib/utils";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import type { ClosingData } from "../types";
import { FinancialReceiptGrid } from "./FinancialReceiptGrid";

type ReceiptItem =
  RouterOutputs["tenant"]["financialReceipt"]["all"]["receipts"][number];

export default function FinancialClosingSalesList({
  closingData,
}: {
  closingData: ClosingData;
}) {
  const isMobile = useIsMobile();
  const { tenant } = useTenant();
  const { selectedCompanyId } = useCompany();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("");
  const [sortField, setSortField] = useState<
    "valor" | "tipo_pagamento" | "serie_nfe" | ""
  >("");
  const [clickCount, setClickCount] = useState(0);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const receiptsQuery = useInfiniteQuery({
    ...trpc.tenant.financialReceipt.all.infiniteQueryOptions({
      limit: 30,
      idClosing: Number(closingData?.id),
      dataAbertura: closingData?.dateOpen,
      horaAbertura: closingData?.hourOpen,
      horaFechamento: closingData?.hourClosed,
      sortOrder: sortField ? (sortOrder as "asc" | "desc") : undefined,
      sortField: sortField || undefined,
      companyId: selectedCompanyId !== 0 ? selectedCompanyId : undefined,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled:
      !!tenant &&
      !!closingData?.id &&
      closingData.dateOpen != null &&
      closingData.hourOpen != null,
  });

  const toggleSortOrder = () => {
    if (clickCount === 2) {
      setSortOrder("");
      setSortField("");
      setClickCount(0);
    } else {
      setSortField("valor");
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
      setClickCount((prevCount) => prevCount + 1);
    }
  };

  const handleSort = (field: "tipo_pagamento" | "serie_nfe") => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("asc");
      return;
    }
    if (sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortField("");
      setSortOrder("");
    } else {
      setSortOrder("asc");
    }
  };

  // Ordenação é feita na API: sortField e sortOrder

  return (
    <div className="rounded-md">
      {isMobile ? (
        <FinancialReceiptGrid
          data={receiptsQuery.data?.pages}
          emptyIcon={<ShoppingCartIcon className="mb-4 size-12" />}
          emptyMessage="Não foram encontradas parcelas a receber."
          fetchNextPage={receiptsQuery.fetchNextPage}
          hasNextPage={receiptsQuery.hasNextPage}
          isFetchingNextPage={receiptsQuery.isFetchingNextPage}
          isLoading={receiptsQuery.isLoading}
          loadingMessage="Carregando parcelas..."
          loadMoreMessage="Carregar mais parcelas"
          noMoreDataMessage="Não há mais parcelas para carregar"
          onReceiptClick={(receipt: ReceiptItem) => {
            const vendaId = receipt?.venda_cabecalho?.ID;
            if (vendaId) {
              setSelectedSaleId(vendaId);
              setIsModalOpen(true);
            }
          }}
          onSortBy={(field) => {
            if (field === "valor") {
              toggleSortOrder();
            } else {
              // Reuso do handleSort para mobile
              handleSort(field);
            }
          }}
          onSortToggle={toggleSortOrder}
          pageItemKeys={["receipts"]}
          sortField={sortField}
          sortOrder={sortOrder}
        />
      ) : (
        <DataTableInfinite<ReceiptItem>
          data={receiptsQuery.data?.pages}
          emptyIcon={<ShoppingCartIcon className="mr-5 size-20" />}
          emptyMessage="Não foram encontradas parcelas a receber."
          fetchNextPage={receiptsQuery.fetchNextPage}
          getRowKey={(receipt) => receipt.ID}
          hasNextPage={receiptsQuery.hasNextPage}
          headers={[
            { key: "actions", label: "", className: "w-4" },
            { key: "hora", label: "Hora", className: "" },
            { key: "cliente", label: "Cliente", className: "" },
            { key: "status", label: "Status", className: "text-center" },
            {
              key: "valor",
              label: (
                <Button
                  className="h-auto px-2 font-medium"
                  onClick={toggleSortOrder}
                  variant="ghost"
                >
                  Vlr. Parcela
                  {sortField === "valor" && sortOrder === "asc" ? (
                    <MoveUpIcon className="ml-1 size-4 md:ml-2" />
                  ) : sortField === "valor" && sortOrder === "desc" ? (
                    <MoveDownIcon className="ml-1 size-4 md:ml-2" />
                  ) : (
                    <MoveVerticalIcon className="ml-1 size-4 md:ml-2" />
                  )}
                </Button>
              ),
              className: "text-center",
            },
            { key: "parcela", label: "Parcela", className: "text-center" },
            {
              key: "tipo_pagamento",
              label: (
                <Button
                  className="h-auto px-2 font-medium"
                  onClick={() => handleSort("tipo_pagamento")}
                  variant="ghost"
                >
                  Tipo Pagamento
                  {sortField === "tipo_pagamento" && sortOrder === "asc" ? (
                    <MoveUpIcon className="ml-1 size-4 md:ml-2" />
                  ) : sortField === "tipo_pagamento" && sortOrder === "desc" ? (
                    <MoveDownIcon className="ml-1 size-4 md:ml-2" />
                  ) : (
                    <MoveVerticalIcon className="ml-1 size-4 md:ml-2" />
                  )}
                </Button>
              ),
              className: "text-center sm:table-cell",
            },
            {
              key: "nfe",
              label: "Nº NFe",
              className: "hidden text-center sm:table-cell",
            },
            {
              key: "serie_nfe",
              label: (
                <Button
                  className="h-auto px-2 font-medium"
                  onClick={() => handleSort("serie_nfe")}
                  variant="ghost"
                >
                  Série NFCe
                  {sortField === "serie_nfe" && sortOrder === "asc" ? (
                    <MoveUpIcon className="ml-1 size-4 md:ml-2" />
                  ) : sortField === "serie_nfe" && sortOrder === "desc" ? (
                    <MoveDownIcon className="ml-1 size-4 md:ml-2" />
                  ) : (
                    <MoveVerticalIcon className="ml-1 size-4 md:ml-2" />
                  )}
                </Button>
              ),
              className: "hidden text-center sm:table-cell",
            },
          ]}
          isFetchingNextPage={receiptsQuery.isFetchingNextPage}
          isLoading={receiptsQuery.isLoading}
          loadingMessage="Carregando parcelas..."
          loadMoreMessage="Carregar mais parcelas"
          noMoreDataMessage="Não há mais parcelas para carregar"
          onRowClick={(receipt) => {
            const vendaId = receipt?.venda_cabecalho?.ID;
            if (vendaId) {
              setSelectedSaleId(vendaId);
              setIsModalOpen(true);
            }
          }}
          pageItemKeys={["receipts"]}
          renderRow={(receipt) => {
            if (!receipt) {
              return null;
            }
            const venda = receipt?.venda_cabecalho;
            const cliente =
              venda?.cliente?.pessoa?.NOME || "Cliente não informado";
            const tipoPagamento =
              receipt?.fin_tipo_recebimento?.DESCRICAO || "Não informado";

            const sequencia = receipt?.SEQUENCIA_FORMA_PAGAMENTO || 1;
            const totalFormas = receipt?.TOTAL_FORMAS_PAGAMENTO || 1;
            const parcelaInfo =
              totalFormas > 1 ? `${sequencia}/${totalFormas}` : "1/1";

            const statusInfo = getNfceStatusInfo({
              devolucao: venda?.DEVOLUCAO,
              canceladoIdUsuario: venda?.CANCELADO_ID_USUARIO,
              nfeStatus: venda?.nfe_cabecalho?.[0]?.STATUS_NOTA ?? null,
            });

            return [
              "",
              receipt?.venda_cabecalho?.HORA_SAIDA,
              cliente,
              <Badge
                className={cn(statusInfo.color, "px-1.5 py-0.5 text-xs")}
                key="status"
                variant={statusInfo.variant}
              >
                {statusInfo.label}
              </Badge>,
              formatAsCurrency(Number(receipt.VALOR_RECEBIDO)),
              parcelaInfo,
              tipoPagamento,
              receipt?.venda_cabecalho?.NFCE === "S" &&
                removeLeadingZero(String(receipt.venda_cabecalho?.NUMERO_NFE)),
              receipt?.venda_cabecalho?.SERIE_NFE,
            ];
          }}
        />
      )}

      {/* Modal do DetailSales */}
      {selectedSaleId && (
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
    </div>
  );
}
