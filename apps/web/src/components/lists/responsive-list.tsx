"use client";

import type { LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DataEmpty } from "./data-empty";
import { DataSkeleton } from "./data-skeleton";

interface ResponsiveListProps<T> {
  data: T[];
  emptyAction?: React.ReactNode;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  isLoading?: boolean;
  renderCards: (data: T[]) => React.ReactNode;
  renderTable: (data: T[]) => React.ReactNode;
  skeletonColumnCount?: number;
  skeletonCount?: number;
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
