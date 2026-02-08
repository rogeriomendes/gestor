"use client";

import {
  MoveDownIcon,
  MoveUpIcon,
  MoveVerticalIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { EmptyState } from "@/components/empty-state";
import { LoadMoreButton } from "@/components/load-more-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/utils/trpc";
import { FinancialReceiptCard } from "./FinancialReceiptCard";

type ReceiptItem =
  RouterOutputs["tenant"]["financialReceipt"]["all"]["receipts"][number];

interface FinancialReceiptGridProps {
  data?: Array<{ receipts?: ReceiptItem[] }>;
  pageItemKeys: string[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  fetchNextPage: () => Promise<unknown>;

  onReceiptClick?: (receipt: ReceiptItem) => void;

  // Ordenação
  sortOrder?: string;
  sortField?: "valor" | "tipo_pagamento" | "serie_nfe" | "";
  onSortToggle?: () => void;
  onSortBy?: (field: "valor" | "tipo_pagamento" | "serie_nfe") => void;

  // Estados vazios e loading
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loadingMessage?: string;
  loadMoreMessage?: string;
  noMoreDataMessage?: string;

  // Configurações opcionais
  rootMargin?: string;
  className?: string;
}

export function FinancialReceiptGrid({
  data,
  pageItemKeys,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  onReceiptClick,
  sortOrder,
  sortField,
  onSortToggle,
  onSortBy,
  emptyMessage = "Nenhuma parcela encontrada",
  emptyIcon,
  loadingMessage = "Carregando...",
  loadMoreMessage = "Carregar mais",
  noMoreDataMessage = "Não há mais parcelas para carregar",
  rootMargin = "30%",
  className = "",
}: FinancialReceiptGridProps) {
  const { ref, inView } = useInView({ rootMargin });

  useEffect(() => {
    const fetchNextPageAndHandlePromise = async () => {
      try {
        await fetchNextPage();
      } catch (error) {
        console.error("Error fetching next page:", error);
      }
    };
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPageAndHandlePromise();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  function extractItemsFromPage(page: {
    receipts?: ReceiptItem[];
  }): ReceiptItem[] {
    if (Array.isArray(pageItemKeys) && pageItemKeys.length > 0) {
      for (const key of pageItemKeys) {
        const maybe = page?.[key as keyof typeof page];
        if (Array.isArray(maybe)) return maybe as ReceiptItem[];
      }
    }
    return [];
  }

  const allReceipts = data?.flatMap(extractItemsFromPage) ?? [];
  const hasData = allReceipts.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controles de ordenação */}
      {(onSortToggle || onSortBy) && (
        <div className="flex justify-center gap-2">
          {onSortToggle && (
            <Button
              className="h-auto px-2 font-medium"
              onClick={onSortToggle}
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
          )}
          {onSortBy && (
            <>
              <Button
                className="h-auto px-2 font-medium"
                onClick={() => onSortBy("tipo_pagamento")}
                variant="ghost"
              >
                Tipo Pag.
                {sortField === "tipo_pagamento" && sortOrder === "asc" ? (
                  <MoveUpIcon className="ml-1 size-4 md:ml-2" />
                ) : sortField === "tipo_pagamento" && sortOrder === "desc" ? (
                  <MoveDownIcon className="ml-1 size-4 md:ml-2" />
                ) : (
                  <MoveVerticalIcon className="ml-1 size-4 md:ml-2" />
                )}
              </Button>
              <Button
                className="h-auto px-2 font-medium"
                onClick={() => onSortBy("serie_nfe")}
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
            </>
          )}
        </div>
      )}

      {/* Grid de recebimentos */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {allReceipts.map((receipt, index) => {
          if (!receipt) return null;

          return (
            <FinancialReceiptCard
              key={`${receipt.ID}-${index}`}
              onClick={onReceiptClick}
              receipt={receipt}
            />
          );
        })}
      </div>

      {/* Loading inicial */}
      {isLoading && !isFetchingNextPage && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div className="space-y-2 rounded-md bg-card p-3" key={index}>
              <div className="mb-2 flex items-start justify-between">
                <Skeleton className="mr-2 h-3 w-3/5" />
                <Skeleton className="h-3 w-1/5" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between gap-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!(isLoading || isFetchingNextPage || hasData) && (
        <EmptyState
          icon={emptyIcon || <ShoppingCartIcon className="mb-4 size-12" />}
          message={emptyMessage}
        />
      )}

      {/* Botão carregar mais */}
      <LoadMoreButton
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        loadingMessage={loadingMessage}
        loadMoreMessage={loadMoreMessage}
        noMoreDataMessage={noMoreDataMessage}
        onLoadMore={() => fetchNextPage()}
        ref={ref}
      />
    </div>
  );
}
