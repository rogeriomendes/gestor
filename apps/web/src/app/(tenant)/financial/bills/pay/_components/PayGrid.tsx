"use client";

import { PackageIcon, SquareCheckIcon } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { EmptyState } from "@/components/empty-state";
import { LoadMoreButton } from "@/components/load-more-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/utils/trpc";
import { PayCard } from "./PayCard";

type BillsPayItem =
  RouterOutputs["tenant"]["financialBillsPay"]["all"]["financialBills"][number];

interface PayGridProps {
  data?: Array<{ financialBills?: BillsPayItem[] }>;
  pageItemKeys: string[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  fetchNextPage: () => Promise<unknown>;

  onBillsClick?: (bills: BillsPayItem) => void;

  // Estados vazios e loading
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loadingMessage?: string;
  loadMoreMessage?: string;
  noMoreDataMessage?: string;

  // Configurações opcionais
  rootMargin?: string;
  className?: string;

  // Seleção de contas
  selectedBills?: Record<string, number | boolean>;
  onBillsSelect?: (billsId: number, value: number, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  selectAll?: boolean;
}

export function PayGrid({
  data,
  pageItemKeys,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  onBillsClick,
  emptyMessage = "Nenhuma conta a pagar encontrada",
  emptyIcon,
  loadingMessage = "Carregando...",
  loadMoreMessage = "Carregar mais",
  noMoreDataMessage = "Não há mais contas para carregar",
  rootMargin = "30%",
  className = "",
  selectedBills = {},
  onBillsSelect,
  onSelectAll,
  selectAll = false,
}: PayGridProps) {
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
    financialBills?: BillsPayItem[];
  }): BillsPayItem[] {
    if (Array.isArray(pageItemKeys) && pageItemKeys.length > 0) {
      for (const key of pageItemKeys) {
        const maybe = page?.[key as keyof typeof page];
        if (Array.isArray(maybe)) return maybe as BillsPayItem[];
      }
    }
    return [];
  }

  const allBills = data?.flatMap(extractItemsFromPage) ?? [];
  const hasData = allBills.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Botão de seleção global */}
      {hasData && (
        <div className="flex items-center justify-between">
          <Button
            className="flex items-center gap-2 px-3"
            // size="sm"
            onClick={() => onSelectAll?.(!selectAll)}
            variant="outline"
          >
            <SquareCheckIcon className="size-4" />
            {selectAll ? "Desmarcar todos" : "Marcar todos"}
          </Button>
          <span className="text-muted-foreground text-sm">
            {
              Object.keys(selectedBills).filter(
                (key) => selectedBills[key] !== false
              ).length
            }{" "}
            selecionado(s)
          </span>
        </div>
      )}

      {/* Grid de contas a pagar */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {allBills.map((bills, index) => {
          if (!bills) return null;

          const isSelected = !!selectedBills[bills.ID];

          return (
            <PayCard
              bills={bills}
              isSelected={isSelected}
              key={`${bills.ID}-${index}`}
              onClick={onBillsClick}
              onSelect={onBillsSelect}
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
                <div className="flex w-full items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-1/5" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between gap-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!(isLoading || isFetchingNextPage || hasData) && (
        <EmptyState
          icon={emptyIcon || <PackageIcon className="mb-4 size-12" />}
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
