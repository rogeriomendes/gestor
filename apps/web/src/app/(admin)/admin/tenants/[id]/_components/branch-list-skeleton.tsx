"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BranchListSkeletonProps {
  count?: number;
}

export function BranchListSkeleton({ count = 3 }: BranchListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`branch-skeleton-${i}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="h-4 w-20 shrink-0" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="h-4 w-20 shrink-0" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="h-4 w-20 shrink-0" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="flex min-w-0 items-start gap-2 sm:col-span-2">
                <Skeleton className="mt-0.5 h-4 w-4 shrink-0" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
