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
  variant?: "table" | "cards";
  count?: number;
  itemHeight?: string;
  columnCount?: number;
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headerIds.map((id) => (
                <TableHead key={id}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonIds.map((id) => (
              <TableRow key={id}>
                {headerIds.map((headerId) => (
                  <TableCell key={headerId}>
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
