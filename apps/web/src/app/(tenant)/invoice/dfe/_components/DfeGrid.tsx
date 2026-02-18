"use client";

import { EmptyState } from "@/components/empty-state";
import { LoadMoreButton } from "@/components/load-more-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/contexts/tenant-context";
import type { RouterOutputs } from "@/utils/trpc";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Building2Icon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { DfeCard } from "./DfeCard";

type DfeItem =
  RouterOutputs["tenant"]["invoiceDfe"]["all"]["invoiceDfe"][number];

interface DfeGridProps {
  data?: Array<{ invoiceDfe?: DfeItem[] }>;
  pageItemKeys: string[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  fetchNextPage: () => Promise<unknown>;

  onDfeClick?: (dfe: DfeItem) => void;
  onDfeHide?: (dfe: DfeItem) => void;

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

export function DfeGrid({
  data,
  pageItemKeys,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  onDfeClick,
  onDfeHide,
  emptyMessage = "Nenhuma nota fiscal encontrada",
  emptyIcon,
  loadingMessage = "Carregando...",
  loadMoreMessage = "Carregar mais",
  noMoreDataMessage = "Não há mais notas fiscais para carregar",
  rootMargin = "30%",
  className = "",
}: DfeGridProps) {
  const { tenant } = useTenant();
  const { ref, inView } = useInView({ rootMargin });

  const companyQuery = useQuery({
    ...trpc.tenant.companies.all.queryOptions(),
    enabled: !!tenant?.id,
  });
  const companyNameByCnpj = useMemo(() => {
    const list = companyQuery.data?.company ?? [];
    return new Map(list.map((c) => [c.CNPJ ?? "", c.RAZAO_SOCIAL ?? null]));
  }, [companyQuery.data?.company]);

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

  function extractItemsFromPage(page: { invoiceDfe?: DfeItem[] }): DfeItem[] {
    if (Array.isArray(pageItemKeys) && pageItemKeys.length > 0) {
      for (const key of pageItemKeys) {
        const maybe = page?.[key as keyof typeof page];
        if (Array.isArray(maybe)) {
          return maybe as DfeItem[];
        }
      }
    }
    return [];
  }

  const allDfes = data?.flatMap(extractItemsFromPage) ?? [];
  const hasData = allDfes.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid de DFEs */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {allDfes.map((dfe, index) => {
          if (!dfe) {
            return null;
          }

          const companyName = dfe.CNPJ_EMPRESA
            ? (companyNameByCnpj.get(dfe.CNPJ_EMPRESA) ?? null)
            : null;

          return (
            <DfeCard
              companyName={companyName}
              dfe={dfe}
              key={`${dfe.CHAVE_ACESSO}-${index}`}
              onClick={onDfeClick}
              onHide={onDfeHide}
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
                {/* <Skeleton className="h-3 w-1/5" /> */}
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between gap-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!(isLoading || isFetchingNextPage || hasData) && (
        <EmptyState
          icon={emptyIcon || <Building2Icon className="mb-4 size-12" />}
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
