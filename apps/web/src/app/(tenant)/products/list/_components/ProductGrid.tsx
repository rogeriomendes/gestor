"use client";

import { PackageIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { EmptyState } from "@/components/empty-state";
import { LoadMoreButton } from "@/components/load-more-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/utils/trpc";
import { ProductCard } from "./ProductCard";

type ProductData =
  RouterOutputs["tenant"]["products"]["all"]["products"][number];

interface ProductGridProps {
  className?: string;
  // Dados da query infinita (páginas do useInfiniteQuery)
  data?: unknown[];
  emptyIcon?: React.ReactNode;

  // Estados vazios e loading
  emptyMessage?: string;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  loadMoreMessage?: string;
  noMoreDataMessage?: string;

  // Callback para clique no produto
  onProductClick?: (product: ProductData) => void;
  pageItemKeys: string[];

  // Configurações opcionais
  rootMargin?: string;
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
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [sentinelMounted, setSentinelMounted] = useState(false);
  const { ref, inView } = useInView({
    rootMargin,
    threshold: 0,
    triggerOnce: false,
  });

  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      sentinelRef.current = el;
      if (el) {
        setSentinelMounted(true);
      }
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }
    },
    [ref]
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Fallback: disparar pelo scroll (window ou container com overflow)
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    const THRESHOLD = 400;

    function checkAndLoad() {
      const el = sentinelRef.current;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight + THRESHOLD) {
        void fetchNextPage();
      }
    }

    function findScrollParent(element: HTMLElement): HTMLElement | null {
      let parent = element.parentElement;
      while (parent) {
        const { overflowY } = getComputedStyle(parent);
        if (
          (overflowY === "auto" ||
            overflowY === "scroll" ||
            overflowY === "overlay") &&
          parent.scrollHeight > parent.clientHeight
        ) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    }

    window.addEventListener("scroll", checkAndLoad, { passive: true });
    const scrollParent = sentinelRef.current
      ? findScrollParent(sentinelRef.current)
      : null;
    scrollParent?.addEventListener("scroll", checkAndLoad, { passive: true });
    checkAndLoad();

    return () => {
      window.removeEventListener("scroll", checkAndLoad);
      scrollParent?.removeEventListener("scroll", checkAndLoad);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, sentinelMounted]);

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
            <div
              className="space-y-2 rounded-md bg-card p-3"
              key={`skeleton-${index}`}
            >
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
      <div className="min-h-px" ref={setRefs}>
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
