"use client";

import type { LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DataEmpty } from "./data-empty";
import { DataSkeleton } from "./data-skeleton";

interface ResponsiveListProps<T> {
  data: T[];
  isLoading?: boolean;
  renderTable: (data: T[]) => React.ReactNode;
  renderCards: (data: T[]) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: React.ReactNode;
  skeletonCount?: number;
  skeletonColumnCount?: number;
}

export function ResponsiveList<T>({
  data,
  isLoading = false,
  renderTable,
  renderCards,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  skeletonCount = 5,
  skeletonColumnCount,
}: ResponsiveListProps<T>) {
  const isMobile = useIsMobile();

  if (isLoading) {
    if (isMobile) {
      return (
        <DataSkeleton count={Math.min(skeletonCount, 5)} variant="cards" />
      );
    }
    return (
      <DataSkeleton
        columnCount={skeletonColumnCount}
        count={skeletonCount}
        variant="table"
      />
    );
  }

  if (data.length === 0) {
    return (
      <DataEmpty
        action={emptyAction}
        description={emptyDescription}
        icon={emptyIcon}
        title={emptyTitle}
      />
    );
  }

  if (isMobile) {
    return <>{renderCards(data)}</>;
  }

  return <>{renderTable(data)}</>;
}
