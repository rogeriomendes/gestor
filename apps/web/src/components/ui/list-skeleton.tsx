import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

interface ListSkeletonProps {
  count?: number;
  itemHeight?: string;
  showCard?: boolean;
  showHeader?: boolean;
}

export function ListSkeleton({
  count = 5,
  itemHeight = "h-20",
  showCard = false,
  showHeader = false,
}: ListSkeletonProps) {
  const skeletonItems = (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          className={`${itemHeight} w-full`}
          key={`list-skeleton-${i}`}
        />
      ))}
    </div>
  );

  if (showCard) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </CardHeader>
        )}
        <CardContent>{skeletonItems}</CardContent>
      </Card>
    );
  }

  return skeletonItems;
}

interface ListItemSkeletonProps {
  count?: number;
}

export function ListItemSkeleton({ count = 5 }: ListItemSkeletonProps) {
  return (
    <div className="rounded-md border">
      {Array.from({ length: count }).map((_, i) => (
        <div
          className="flex items-center justify-between border-b p-4 last:border-b-0"
          key={`list-item-skeleton-${i}`}
        >
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

interface CardListSkeletonProps {
  count?: number;
}

export function CardListSkeleton({ count = 3 }: CardListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`card-list-skeleton-${i}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
