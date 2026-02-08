"use client";

import { EmptyState } from "@/components/empty-state";
import { LoadMoreButton } from "@/components/load-more-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/utils/trpc";
import { PackageIcon } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { ProductCard } from "./ProductCard";

type ProductData =
  RouterOutputs["tenant"]["products"]["all"]["products"][number];

interface ProductGridProps {
  // Dados da query infinita (páginas do useInfiniteQuery)
  data?: unknown[];
  pageItemKeys: string[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  fetchNextPage: () => Promise<unknown>;

  // Callback para clique no produto
  onProductClick?: (product: ProductData) => void;

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

export function ProductGrid({
  data,
  pageItemKeys,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  onProductClick,
  emptyMessage = "Nenhum produto encontrado",
  emptyIcon,
  loadingMessage = "Carregando...",
  loadMoreMessage = "Carregar mais",
  noMoreDataMessage = "Não há mais produtos para carregar",
  rootMargin = "30%",
  className = "",
}: ProductGridProps) {
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

  function extractItemsFromPage(page: unknown): ProductData[] {
    if (Array.isArray(pageItemKeys) && pageItemKeys.length > 0) {
      for (const key of pageItemKeys) {
        const maybe = page?.[key as keyof typeof page];
        if (Array.isArray(maybe)) {
          return maybe as ProductData[];
        }
      }
    }
    return [];
  }

  const allProducts = data?.flatMap(extractItemsFromPage) ?? [];
  const hasData = allProducts.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid de produtos */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {allProducts.map((product, index) => {
          if (!product) {
            return null;
          }

          return (
            <ProductCard
              key={`${product.ID}-${index}`}
              onClick={onProductClick}
              product={product}
            />
          );
        })}
      </div>

      {/* Loading inicial */}
      {isLoading && !isFetchingNextPage && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div className="space-y-2 rounded-md bg-card p-3" key={`skeleton-${index}`}>
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
