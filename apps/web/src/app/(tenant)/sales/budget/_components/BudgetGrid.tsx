"use client";

import { SheetIcon } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { EmptyState } from "@/components/empty-state";
import { LoadMoreButton } from "@/components/load-more-button";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetCard } from "./BudgetCard";

interface BudgetGridProps {
  // Dados da query infinita
  data?: any[];
  pageItemKeys: string[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  fetchNextPage: () => Promise<unknown>;

  // Callback para clique no orçamento
  onBudgetClick?: (budget: any) => void;

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

export function BudgetGrid({
  data,
  pageItemKeys,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  onBudgetClick,
  emptyMessage = "Nenhum orçamento encontrado",
  emptyIcon,
  loadingMessage = "Carregando...",
  loadMoreMessage = "Carregar mais",
  noMoreDataMessage = "Não há mais orçamentos para carregar",
  rootMargin = "30%",
  className = "",
}: BudgetGridProps) {
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

  function extractItemsFromPage(page: any): any[] {
    if (Array.isArray(pageItemKeys) && pageItemKeys.length > 0) {
      for (const key of pageItemKeys) {
        const maybe = page?.[key];
        if (Array.isArray(maybe)) {
          return maybe;
        }
      }
    }
    return [];
  }

  const allBudgets = data?.flatMap(extractItemsFromPage) ?? [];
  const hasData = allBudgets.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid de orçamentos */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {allBudgets.map((budget, index) => {
          if (!budget) {
            return null;
          }

          return (
            <BudgetCard
              budget={budget}
              key={`${budget.ID}-${index}`}
              onClick={onBudgetClick}
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
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!(isLoading || isFetchingNextPage || hasData) && (
        <EmptyState
          icon={emptyIcon || <SheetIcon className="mb-4 size-12" />}
          message={emptyMessage}
        />
      )}

      {/* Botão carregar mais */}
      <div ref={ref}>
        <LoadMoreButton
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          loadingMessage={loadingMessage}
          loadMoreMessage={loadMoreMessage}
          noMoreDataMessage={noMoreDataMessage}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </div>
  );
}
