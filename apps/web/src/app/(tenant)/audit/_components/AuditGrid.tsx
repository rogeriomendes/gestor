"use client";

import { FileSearch2Icon } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { EmptyState } from "@/components/empty-state";
import { LoadMoreButton } from "@/components/load-more-button";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/utils/trpc";
import { AuditCard } from "./AuditCard";

type AuditItem = RouterOutputs["tenant"]["audit"]["all"]["audit"][number];

interface AuditGridProps {
  data?: Array<{ audit?: AuditItem[] }>;
  fetchNextPage: () => Promise<unknown>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  onAuditClick?: (item: AuditItem) => void;
}

export function AuditGrid({
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  onAuditClick,
}: AuditGridProps) {
  const { ref, inView } = useInView({ rootMargin: "30%" });

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

  const allAudit = data?.flatMap((page) => page.audit ?? []) ?? [];
  const hasData = allAudit.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {allAudit.map((item) => (
          <AuditCard audit={item} key={item.ID} onClick={onAuditClick} />
        ))}
      </div>

      {isLoading && !isFetchingNextPage && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              className="space-y-2 rounded-md border bg-card p-3"
              key={index}
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {!(isLoading || isFetchingNextPage || hasData) && (
        <EmptyState
          icon={<FileSearch2Icon className="mb-4 size-12" />}
          message="Não foram encontrados registros de auditoria."
        />
      )}

      <div ref={ref}>
        <LoadMoreButton
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          loadingMessage="Carregando auditorias..."
          loadMoreMessage="Carregar mais auditorias"
          noMoreDataMessage="Não há mais auditorias para carregar"
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    </div>
  );
}
