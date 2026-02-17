"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { EmptyState } from "@/components/empty-state";
import { LoadMoreButton } from "@/components/load-more-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableInfiniteHeader {
  key: string;
  label: string | ReactNode;
  className?: string;
}

export interface DataTableInfiniteProps<T> {
  /** Páginas retornadas por useInfiniteQuery (ex.: data?.pages) */
  data?: unknown[];
  /** Chaves em cada página onde estão os itens (ex.: ["products"], ["financialBills"]) */
  pageItemKeys: string[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  fetchNextPage: () => Promise<unknown>;

  /** Cabeçalhos da tabela (key, label, className opcional) */
  headers: DataTableInfiniteHeader[];

  /** Renderiza uma linha; retorna array de células na ordem dos headers ou null para omitir */
  renderRow: (item: T, index: number) => ReactNode[] | null;

  onRowClick?: (item: T, index: number) => void;
  getRowClassName?: (item: T, index: number) => string;

  /** Chave estável por item (ex.: item => item.ID). Se não passar, usa index. */
  getRowKey?: (item: T, index: number) => string | number;

  selectedRows?: Set<number> | number[];

  emptyMessage?: string;
  emptyIcon?: ReactNode;
  loadingMessage?: string;
  loadMoreMessage?: string;
  noMoreDataMessage?: string;

  rootMargin?: string;
  className?: string;
  tableClassName?: string;
}

function extractItemsFromPage<T>(page: unknown, pageItemKeys: string[]): T[] {
  if (!pageItemKeys.length) {
    return [];
  }
  for (const key of pageItemKeys) {
    const maybe = (page as Record<string, unknown>)?.[key];
    if (Array.isArray(maybe)) {
      return maybe as T[];
    }
  }
  return [];
}

export function DataTableInfinite<T>({
  data,
  pageItemKeys,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  headers,
  renderRow,
  onRowClick,
  getRowClassName,
  getRowKey,
  selectedRows,
  emptyMessage = "Nenhum item encontrado",
  emptyIcon,
  loadingMessage = "Carregando...",
  loadMoreMessage = "Carregar mais",
  noMoreDataMessage = "Não há mais itens para carregar",
  rootMargin = "30%",
  className = "",
  tableClassName,
}: DataTableInfiniteProps<T>) {
  const { ref, inView } = useInView({ rootMargin });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = useMemo(
    () =>
      data?.flatMap((page) => extractItemsFromPage<T>(page, pageItemKeys)) ??
      [],
    [data, pageItemKeys]
  );
  const hasData = allItems.length > 0;

  const selectedRowsSet = useMemo(() => {
    if (!selectedRows) {
      return new Set<number>();
    }
    return Array.isArray(selectedRows) ? new Set(selectedRows) : selectedRows;
  }, [selectedRows]);

  return (
    <div className={cn("rounded-md border", className)}>
      <Table className={cn("bg-card", tableClassName)}>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead className={header.className} key={header.key}>
                {header.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="text-xs md:text-sm">
          {allItems.map((item, index) => {
            if (item == null) {
              return null;
            }
            const rowData = renderRow(item, index);
            if (rowData == null) {
              return null;
            }

            const customClassName = getRowClassName?.(item, index) ?? "";
            const isSelected = selectedRowsSet.has(index);
            const rowKey = getRowKey
              ? String(getRowKey(item, index))
              : `row-${index}`;
            const rowClassName = cn(
              // "h-8",
              onRowClick && "cursor-pointer hover:bg-muted/50",
              customClassName
            );

            return (
              <TableRow
                className={rowClassName}
                data-state={isSelected ? "selected" : "unselected"}
                key={rowKey}
                onClick={(e) => {
                  if (
                    (e.target as HTMLElement).closest(
                      "button, a[href], [role=button], input[type=checkbox], [role=checkbox], [data-dropdown-menu-trigger], [data-no-row-click]"
                    )
                  ) {
                    return;
                  }
                  onRowClick?.(item, index);
                }}
              >
                {headers.map((header, colIndex) => (
                  <TableCell className={header.className} key={header.key}>
                    {rowData[colIndex] ?? ""}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {isLoading && !isFetchingNextPage && (
        <div className="m-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton className="h-10 w-full" key={i} />
          ))}
        </div>
      )}

      {!(isLoading || isFetchingNextPage || hasData) && (
        <EmptyState icon={emptyIcon} message={emptyMessage} />
      )}

      <div ref={ref}>
        <LoadMoreButton
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          loadingMessage={loadingMessage}
          loadMoreMessage={loadMoreMessage}
          noMoreDataMessage={noMoreDataMessage}
          onLoadMore={() => void fetchNextPage()}
        />
      </div>
    </div>
  );
}
