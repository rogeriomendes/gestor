"use client";

import { ShoppingCartIcon } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { EmptyState } from "@/components/empty-state";
import { LoadMoreButton } from "@/components/load-more-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/utils/trpc";
import { ReceiveCard } from "./ReceiveCard";

type ReceiveItem =
  RouterOutputs["tenant"]["financialBillsReceive"]["all"]["receive"][number];

interface ReceiveGridProps {
  data?: Array<{ receive?: ReceiveItem[] }>;
  pageItemKeys: string[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  fetchNextPage: () => Promise<unknown>;

  onReceiveClick?: (receive: ReceiveItem) => void;

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

export function ReceiveGrid({
  data,
  pageItemKeys,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  onReceiveClick,
  emptyMessage = "Nenhum recebimento encontrado",
  emptyIcon,
  loadingMessage = "Carregando...",
  loadMoreMessage = "Carregar mais",
  noMoreDataMessage = "Não há mais recebimentos para carregar",
  rootMargin = "30%",
  className = "",
}: ReceiveGridProps) {
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
    receive?: ReceiveItem[];
  }): ReceiveItem[] {
    if (Array.isArray(pageItemKeys) && pageItemKeys.length > 0) {
      for (const key of pageItemKeys) {
        const maybe = page?.[key as keyof typeof page];
        if (Array.isArray(maybe)) return maybe as ReceiveItem[];
      }
    }
    return [];
  }

  const allReceives = data?.flatMap(extractItemsFromPage) ?? [];
  const hasData = allReceives.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid de recebimentos */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {allReceives.map((receive, index) => {
          if (!receive) return null;

          return (
            <ReceiveCard
              key={`${receive.fin_lancamento_receber?.ID}-${index}`}
              onClick={onReceiveClick}
              receive={receive}
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
