"use client";

import { useMemo } from "react";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataSkeletonProps {
  columnCount?: number;
  count?: number;
  itemHeight?: string;
  variant?: "table" | "cards";
}

let skeletonIdCounter = 0;

export function DataSkeleton({
  variant = "table",
  count = 8,
  itemHeight = "h-8",
  columnCount = 4,
}: DataSkeletonProps) {
  const skeletonIds = useMemo(
    () =>
      Array.from({ length: count }, () => {
        skeletonIdCounter += 1;
        return `data-skeleton-${skeletonIdCounter}`;
      }),
    [count]
  );

  const headerIds = useMemo(
    () =>
      Array.from({ length: columnCount }, () => {
        skeletonIdCounter += 1;
        return `header-skeleton-${skeletonIdCounter}`;
      }),
    [columnCount]
  );

  if (variant === "table") {
    return (
      <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 border-b hover:bg-transparent">
              {headerIds.map((id) => (
                <TableHead key={id}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonIds.map((id) => (
              <TableRow className="border-border/30 border-b" key={id}>
                {headerIds.map((headerId) => (
                  <TableCell className="py-3" key={headerId}>
                    <Skeleton className={`${itemHeight} w-full`} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Cards variant
  return <ListSkeleton count={count} itemHeight={itemHeight} />;
}
